import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This is a critical check. The app will not function without a Google AI API key.
if (!process.env.GOOGLE_API_KEY) {
  throw new Error(
    'GOOGLE_API_KEY is not defined in the environment. Please add it to your .env file. You can get a key from https://aistudio.google.com/app/apikey.'
  );
}

export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GOOGLE_API_KEY})],
  model: 'googleai/gemini-1.5-flash-latest',
});
