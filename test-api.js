// Simple test script to check if the ZerePy API is working
const fetch = require('node-fetch');

async function testZerePyAPI() {
  try {
    const response = await fetch('http://localhost:8000/game/prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'Hello, how are you?',
        system_prompt: 'You are an AI assistant for the Baultro gaming platform.',
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API Response:', data);
    console.log('API Text:', data.text);
    return data;
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Execute the test
testZerePyAPI().then(() => {
  console.log('Test completed');
});
