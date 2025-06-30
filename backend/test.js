import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function test() {
  try {
    const result = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Say hello from test script!' }],
    });

    console.log('✅ OpenAI responded:', result.choices[0].message.content);
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

test();