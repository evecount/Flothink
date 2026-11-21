

/**
 * @fileOverview A tool for fetching the text content of a URL.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { htmlToText } from 'html-to-text';


export const fetchUrlTool = ai.defineTool(
  {
    name: 'fetchUrl',
    description: 'Fetches the text content of a given URL. Useful for reading attached documents or links.',
    inputSchema: z.object({
      url: z.string().url().describe('The URL to fetch content from.'),
    }),
    outputSchema: z.string().describe('The text content of the webpage.'),
  },
  async ({ url }) => {
    console.log(`Fetching content from: ${url}`);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();
      const text = htmlToText(html, {
        wordwrap: 130
      });
      
      console.log(`Successfully fetched content of length: ${text.length}`);
      // Return a manageable chunk of text
      return text.substring(0, 8000); 
    } catch (e: any) {
      console.error(`Failed to fetch URL ${url}:`, e);
      return `Error: Could not fetch content from the URL. Reason: ${e.message}`;
    }
  }
);
