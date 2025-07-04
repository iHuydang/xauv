
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Store this in Secrets
});

async function generateText() {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Write a haiku about programming"
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    console.log(completion.choices[0].message.content);
  } catch (error) {
    console.error('Error calling OpenAI:', error);
  }
}

// Call the function
generateText();
