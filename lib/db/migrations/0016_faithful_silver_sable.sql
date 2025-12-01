CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "embeddings" ALTER COLUMN "embedding" SET DATA TYPE vector(1536) USING embedding::vector;