import { OllamaClient } from './OllamaClient';
import { RawSurfingData, SurfingPreprocessor } from './Preprocessor';
import { LocalVectorStore } from './LocalVectorStore';

export class BrainCoordinator {
  private vectorStore: LocalVectorStore;
  private reasoningModel: string;

  // Now accepts the chosen model, defaulting to deepseek
  constructor(model: string = 'deepseek-r1:1.5b') {
    this.vectorStore = new LocalVectorStore();
    this.reasoningModel = model;
  }

  /**
   * STEP 1: Process and ingest raw surfing data into the local vector DB.
   */
  async ingestSurfingData(rawData: RawSurfingData[]) {
    const processedChunks = SurfingPreprocessor.processData(rawData);
    await this.vectorStore.addDocuments(processedChunks);
  }

  /**
   * STEP 2: RAG Pipeline - Search and Analyze the 5 W's
   */
  async getDeepInsights(userQuery: string, onToken: (t: string) => void): Promise<string> {
    const relevantDocs = await this.vectorStore.search(userQuery, 4);
    const contextStr = relevantDocs.map(d => d.text).join('\n\n');

    const prompt = `
System Context: You are the local Brain Assistant for the Personal Intelligence Engine. You have access to the user's web surfing dataset.

Relevant User Data:
${contextStr}

Task:
Based strictly on the provided data, analyze the user's web behavior matching the query: "${userQuery}".
Provide deep reasoning using the 5 W's structure: Who, What, When, Where, Why.

After the 5 W's, write a friendly summary answering their query directly.
`;

    return await OllamaClient.generateStream(this.reasoningModel, prompt, onToken);
  }

  /**
   * STEP 3: Chatbot mode (Conversation about the data)
   */
  async chatAboutData(userMessage: string, onToken: (t: string) => void): Promise<string> {
    const relevantDocs = await this.vectorStore.search(userMessage, 3);
    const contextStr = relevantDocs.map(d => d.text).join('\n\n');

    const prompt = `
You are a helpful local assistant analyzing the user's personal web history.
Here is the relevant data retrieved from their local vault:
${contextStr}

User says: "${userMessage}"

Respond conversationally as if you are their personal AI companion. Base your answer strictly on the retrieved data.
`;
    
    return await OllamaClient.generateStream(this.reasoningModel, prompt, onToken);
  }
}
