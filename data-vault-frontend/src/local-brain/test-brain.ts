import { BrainCoordinator } from './BrainCoordinator';

// Mock surfing dataset
const mockSurfingData = [
  {
    url: 'https://youtube.com/watch?v=123',
    title: 'Top 10 Video Game Fails',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    timeSpentSeconds: 45 * 60, // 45 minutes
    category: 'Entertainment'
  },
  {
    url: 'https://github.com/microsoft/vscode',
    title: 'vscode - GitHub',
    timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), // Yesterday, a bit later
    timeSpentSeconds: 15 * 60, // 15 minutes
    category: 'Development'
  },
  {
    url: 'https://twitter.com/home',
    title: 'X / Twitter',
    timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), // Yesterday, later
    timeSpentSeconds: 30 * 60, // 30 minutes
    category: 'Social Media'
  }
];

async function runTest() {
  console.log('--- Starting Local PIE Brain Test ---');
  const coordinator = new BrainCoordinator();

  try {
    // 1. Ingest Data
    await coordinator.ingestSurfingData(mockSurfingData);

    // 2. Test Deep Reasoning (5 W's)
    const query = "Analyze my distractions from yesterday.";
    console.log(`\n[User Query]: ${query}`);
    
    console.log(`\n[DeepSeek-R1 is thinking...]\n`);
    const insights = await coordinator.getDeepInsights(query, (t) => process.stdout.write(t));
    console.log(insights);

    // 3. Test Conversational Chatbot
    const chatQuery = "Where exactly did I get distracted yesterday and for how long?";
    console.log(`\n[User Chat]: ${chatQuery}`);
    
    console.log(`\n[DeepSeek-R1 is typing...]\n`);
    const chatResponse = await coordinator.chatAboutData(chatQuery, (t) => process.stdout.write(t));
    console.log(chatResponse);

    console.log('\n--- Test Complete ---');
  } catch (error) {
    console.error('Test Failed:', error);
  }
}

runTest();
