import numpy as np

try:
    import faiss
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False

class FaceVectorDB:
    def __init__(self, dimension: int = 128):
        self.dimension = dimension
        self.has_faiss = HAS_FAISS
        
        if self.has_faiss:
            # L2 distance index (face_recognition embeddings are normalized, L2 relates directly to distance)
            self.index = faiss.IndexFlatL2(self.dimension)
            self.user_ids = []
    
    def build_index(self, gallery: list):
        """
        Builds the vector indexing layer from the gallery data.
        gallery format: [{"user_id": "...", "embeddings": [...]}, ...]
        """
        if not self.has_faiss:
            return  # Fallback to naive search in main.py
            
        if not gallery:
            self.index = faiss.IndexFlatL2(self.dimension)
            self.user_ids = []
            return
            
        self.user_ids = []
        embeddings_list = []
        
        for item in gallery:
            if item.get("embeddings") and isinstance(item["embeddings"], list) and len(item["embeddings"]) == self.dimension:
                self.user_ids.append(item["user_id"])
                embeddings_list.append(item["embeddings"])
                
        if embeddings_list:
            embeddings_np = np.array(embeddings_list, dtype=np.float32)
            # Recreate index to discard old data
            self.index = faiss.IndexFlatL2(self.dimension)
            self.index.add(embeddings_np)
            
    def search(self, target_embedding: list[float], tolerance: float = 0.5):
        """
        Perform O(log N) approximate nearest neighbor search via FAISS.
        Returns matched_user_id or None.
        """
        if not self.has_faiss or self.index.ntotal == 0:
            return None
            
        target_np = np.array([target_embedding], dtype=np.float32)
        
        # Search for the top 1 nearest neighbor
        distances, indices = self.index.search(target_np, k=1)
        
        if distances[0][0] <= tolerance:
            idx = indices[0][0]
            if 0 <= idx < len(self.user_ids):
                return {
                    "user_id": self.user_ids[idx],
                    "distance": float(distances[0][0])
                }
                
        return None
