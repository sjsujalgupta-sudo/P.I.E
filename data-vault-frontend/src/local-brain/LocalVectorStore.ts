import { OllamaClient } from './OllamaClient';
import { ProcessedChunk } from './Preprocessor';

interface VectorDocument extends ProcessedChunk {
  embedding: number[];
}

export class LocalVectorStore {
  private documents: VectorDocument[] = [];
  private embeddingModel = 'nomic-embed-text'; // The lightweight model we use

  /**
   * Adds processed text chunks to the local vector memory
   */
  async addDocuments(chunks: ProcessedChunk[]): Promise<void> {
    for (const chunk of chunks) {
      // Get the mathematical representation of the text from Ollama
      const embedding = await OllamaClient.getEmbedding(this.embeddingModel, chunk.text);
      this.documents.push({
        ...chunk,
        embedding,
      });
      console.log(`Stored vector for: ${chunk.id}`);
    }
  }

  /**
   * Performs Local RAG by searching for the most relevant data based on the user's question
   */
  async search(query: string, topK: number = 3): Promise<ProcessedChunk[]> {
    // 1. Convert the user's question into an embedding
    const queryEmbedding = await OllamaClient.getEmbedding(this.embeddingModel, query);

    // 2. Compare the query to all stored documents using Cosine Similarity
    const scoredDocs = this.documents.map((doc) => {
      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
      return { doc, similarity };
    });

    // 3. Sort by most relevant and return top K results
    scoredDocs.sort((a, b) => b.similarity - a.similarity);
    return scoredDocs.slice(0, topK).map(s => s.doc);
  }

  // Ultra-efficient math function to compare two vectors locally
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
