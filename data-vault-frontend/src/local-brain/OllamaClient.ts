// This is the Parallel Framework API client for local Ollama.
// It bypasses any existing AI logic to run entirely offline.

const OLLAMA_URL = 'http://127.0.0.1:11434/api';

export class OllamaClient {
  /**
   * Generates text using a local Ollama model in real-time (Streaming)
   */
  static async generateStream(model: string, prompt: string, onToken: (token: string) => void): Promise<string> {
    try {
      const response = await fetch(`${OLLAMA_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: true }),
      });

      if (!response.ok) {
        throw new Error(`Ollama generation failed: ${response.statusText}`);
      }

      const decoder = new TextDecoder('utf-8');
      let fullText = '';

      if (response.body) {
        // @ts-ignore - Node.js native fetch body is async iterable
        for await (const chunk of response.body) {
          const textChunk = decoder.decode(chunk, { stream: true });
          const lines = textChunk.split('\n').filter(l => l.trim() !== '');
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.response) {
                onToken(parsed.response);
                fullText += parsed.response;
              }
            } catch (e) {
              // Ignore incomplete JSON lines
            }
          }
        }
      }
      return fullText;
    } catch (error) {
      console.error('Ollama Client Error:', error);
      throw error;
    }
  }

  /**
   * Gets vector embeddings for a given text using a local embedding model.
   */
  static async getEmbedding(model: string, prompt: string): Promise<number[]> {
    try {
      const response = await fetch(`${OLLAMA_URL}/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt }),
      });

      if (!response.ok) {
        throw new Error(`Ollama embedding failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('Ollama Embedding Error:', error);
      throw error;
    }
  }
}
