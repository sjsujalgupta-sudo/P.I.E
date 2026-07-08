import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import * as readline from 'readline';
import { BrainCoordinator } from './BrainCoordinator';
import { RawSurfingData } from './Preprocessor';

// Database absolute path from the backend
const DB_PATH = 'd:/Personal-Data-Vault-Projects/knowledge-vault-backend/vault.db';

async function fetchRealDataset(): Promise<RawSurfingData[]> {
  try {
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    console.log(`\nConnecting to PIE Knowledge Vault at ${DB_PATH}...`);
    
    const rows = await db.all("SELECT * FROM browsing_data ORDER BY timestamp DESC LIMIT 50");
    
    if (rows.length === 0) {
        console.warn("No browsing data found in the vault!");
        return [];
    }

    const mappedData = rows.map(row => ({
      url: row.url || 'Unknown',
      title: row.title || 'Unknown Title',
      timestamp: row.timestamp || new Date().toISOString(),
      timeSpentSeconds: row.time_spent || row.duration || 300, 
      category: row.category || 'General Browsing'
    }));
    
    console.log(`Successfully fetched ${mappedData.length} records.`);
    return mappedData;
  } catch (error) {
    console.error("Failed to read from vault.db. Make sure the database exists.", error);
    return [];
  }
}

async function startInteractiveChat() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`\n=============================================`);
  console.log(`          PIE Local Brain Launcher           `);
  console.log(`=============================================`);
  console.log(`Which model would you like to use?`);
  console.log(`1) DeepSeek-R1 (1.5B) - Slower, shows deep <think> train of thought.`);
  console.log(`2) Qwen 2.5 Coder (1.5B) - Lightning fast, straight to the point.\n`);

  rl.question('Select option (1 or 2): ', async (choice) => {
    let chosenModel = 'deepseek-r1:1.5b';
    if (choice.trim() === '2') {
        chosenModel = 'qwen2.5-coder:1.5b';
    }

    console.log(`\nInitializing PIE Brain with [${chosenModel}]...`);
    const dataset = await fetchRealDataset();
    if (dataset.length === 0) {
        rl.close();
        return;
    }

    const coordinator = new BrainCoordinator(chosenModel);
    await coordinator.ingestSurfingData(dataset);

    console.log(`\nI have ingested your real browsing data.`);
    console.log(`Ask me anything about your history, or type 'exit' to quit.\n`);

    const askQuestion = () => {
      rl.question('\nYou: ', async (query) => {
        if (query.toLowerCase() === 'exit' || query.toLowerCase() === 'quit') {
          rl.close();
          return;
        }

        console.log(`\nPIE Brain: `);
        
        try {
            // Stream the tokens directly to the terminal as they arrive
            const onToken = (token: string) => {
                process.stdout.write(token);
            };

            if (query.toLowerCase().includes('analyze') || query.toLowerCase().includes('why')) {
                await coordinator.getDeepInsights(query, onToken);
            } else {
                await coordinator.chatAboutData(query, onToken);
            }
            console.log(); // Print final newline
        } catch (e) {
            console.error("\nError generating response.", e);
        }
        
        askQuestion(); // Loop back
      });
    };

    askQuestion();
  });
}

startInteractiveChat();
