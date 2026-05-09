-- Habilitar extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Agregar columnas a tabla analyses
ALTER TABLE analyses
ADD COLUMN IF NOT EXISTS visual_description TEXT,
ADD COLUMN IF NOT EXISTS visual_embedding vector(1024);

-- Crear índice HNSW para búsquedas vectoriales rápidas
-- m=16 balance entre velocidad y calidad de inserción
-- ef_construction=64 mejor calidad de búsqueda inicial
CREATE INDEX IF NOT EXISTS idx_analyses_visual_embedding
ON analyses
USING hnsw (visual_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- RPC function para búsqueda semántica por embedding
CREATE OR REPLACE FUNCTION search_analyses_by_embedding(
  query_embedding vector,
  url_list text[],
  min_score int,
  limit_results int
)
RETURNS TABLE (id uuid, url text, report jsonb, score int) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.url,
    a.report,
    a.score
  FROM analyses a
  WHERE
    a.url = ANY(url_list)
    AND a.score >= min_score
    AND a.visual_embedding IS NOT NULL
  ORDER BY a.visual_embedding <=> query_embedding ASC
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;
