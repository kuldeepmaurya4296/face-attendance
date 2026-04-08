
import axios from 'axios';

const ML_ENGINE_URL = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://127.0.0.1:8000';

export interface MLVerifyResult {
  success: boolean;
  liveness_pass: boolean;
  face_match?: boolean;
  user_id?: string;
  note?: string;
}

export class MLService {
  /**
   * Extract embeddings from an image
   */
  static async register(imageFile: Blob): Promise<number[]> {
    const formData = new FormData();
    formData.append('file', imageFile);

    const res = await fetch(`${ML_ENGINE_URL}/api/ml/register`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.detail || 'ML extraction failed');
    return data.embeddings;
  }

  /**
   * Check for duplicate face in a gallery
   */
  static async checkDuplicate(imageFile: Blob, gallery: any[]): Promise<{ duplicate: boolean; matched_user_id: string | null }> {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('gallery_data', JSON.stringify(gallery));

    const res = await fetch(`${ML_ENGINE_URL}/api/ml/check-duplicate`, {
      method: 'POST',
      body: formData,
    });

    return await res.json();
  }

  /**
   * Search for a face in a gallery (KIOSK Mode)
   */
  static async search(imageFile: Blob, gallery: any[]): Promise<MLVerifyResult> {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('gallery_data', JSON.stringify(gallery));

    const res = await fetch(`${ML_ENGINE_URL}/api/ml/search`, {
      method: 'POST',
      body: formData,
    });

    return await res.json();
  }
}
