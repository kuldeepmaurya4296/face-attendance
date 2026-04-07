import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { auth, authorize } from '@/lib/auth';
import { safeDecryptEmbeddings } from '@/lib/services/encryption';
import { appLog } from '@/lib/services/logger';

// Very lightweight in-memory cache for gallery
// In production, redis would be used here.
const generateCacheKey = (companyId: string) => `gallery_${companyId}`;
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes TTL

// global variable handles hot reloads in dev
declare global {
  var galleryCache: Map<string, { data: any; timestamp: number }> | undefined;
}
const cache = global.galleryCache || new Map();
if (!global.galleryCache) {
  global.galleryCache = cache;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ company_id: string }> }) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });

    if (!authorize(authResult.user, ['Owner', 'SuperAdmin', 'Admin'])) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { company_id } = resolvedParams;

    // Check cache
    const cacheKey = generateCacheKey(company_id);
    const cachedEntry = cache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ success: true, data: cachedEntry.data });
    }

    await connectDB();
    const users = await User.find({ 
      company_id, 
      face_embeddings: { $exists: true, $ne: [] } 
    }).select('_id name email face_embeddings');
    
    // Process and decrypt embeddings safely
    const gallery = users.map(u => {
      let embeddings: number[] = [];
      try {
        embeddings = safeDecryptEmbeddings(u.face_embeddings);
      } catch (e) {
        appLog.error('DECRYPTION_ERROR', { user_id: u._id });
        // Return empty array on decryption error to prevent crashing the whole gallery
      }

      return {
        user_id: u._id.toString(),
        name: u.name,
        email: u.email,
        embeddings
      };
    }).filter(g => g.embeddings && g.embeddings.length > 0); // Exclude failed decryptions
    
    // Update cache
    cache.set(cacheKey, { data: gallery, timestamp: Date.now() });

    return NextResponse.json({ success: true, data: gallery });
  } catch (err: any) {
    appLog.error('GALLERY_FETCH_ERROR', { error: err.message });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
