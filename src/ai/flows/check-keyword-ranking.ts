'use server';

/**
 * @fileOverview A keyword rank checker AI agent for a given URL.
 *
 * - checkKeywordRanking - A function that handles the keyword ranking process.
 * - CheckKeywordRankingInput - The input type for the checkKeywordRanking function.
 * - CheckKeywordRankingOutput - The return type for the checkKeywordRanking function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckKeywordRankingInputSchema = z.object({
  keywords: z.string().describe('A comma-separated list of keywords to check ranking for.'),
  url: z.string().url().describe('The URL of the Blogger website to check ranking for.'),
  platform: z
    .string()
    .default('google')
    .describe('The platform or search engine to check ranking on (e.g., google, youtube).'),
  country: z.string().default('US').describe('The target country for the search.'),
});
export type CheckKeywordRankingInput = z.infer<typeof CheckKeywordRankingInputSchema>;

const RankingResultSchema = z.object({
  keyword: z.string().describe('The keyword being checked.'),
  ranking: z
    .number()
    .nullable()
    .describe('The ranking of the URL for the keyword. Null if not found.'),
  searchResultPage: z.string().describe('The URL of the search engine result page.'),
});

const CheckKeywordRankingOutputSchema = z.array(RankingResultSchema);
export type CheckKeywordRankingOutput = z.infer<typeof CheckKeywordRankingOutputSchema>;

export async function checkKeywordRanking(input: CheckKeywordRankingInput): Promise<CheckKeywordRankingOutput> {
  return checkKeywordRankingFlow(input);
}

const searchWeb = ai.defineTool(
  {
    name: 'searchWeb',
    description: 'Searches the web for a given query and returns the HTML content of the search results page.',
    inputSchema: z.object({
      query: z.string().describe('The search query.'),
      platform: z
        .string()
        .default('google')
        .describe('The platform or search engine to check ranking on (e.g., google, youtube).'),
      country: z.string().default('US').describe('The target country for the search.'),
    }),
    outputSchema: z.string(),
  },
  async input => {
    // Placeholder implementation for web search.  Replace with actual search API call.
    // This implementation just returns a canned response that includes the query.
    console.log(`Simulating web search for ${input.query} on ${input.platform} in ${input.country}`);
    const searchResultPage = `https://www.example.com/search?q=${encodeURIComponent(input.query)}`;
    return `<html><body><h1>Search Results for ${input.query}</h1><p>This is a simulated search result page.</p><a href="${input.url}">${input.url}</a></body></html>`;
  }
);

const checkRankingPrompt = ai.definePrompt({
  name: 'checkRankingPrompt',
  tools: [searchWeb],
  input: {schema: CheckKeywordRankingInputSchema},
  output: {schema: CheckKeywordRankingOutputSchema},
  prompt: `You are an expert SEO analyst tasked with determining the ranking of a given URL for a list of keywords on a specified search engine.

  The user will provide a list of keywords and a URL to check.
  Your job is to find the ranking of the URL for each keyword by using the searchWeb tool and return a list of ranking results.

  Here's how you should proceed:

  1.  Split the keywords string into a list of individual keywords.
  2.  For each keyword:
  3.  Use the searchWeb tool to search for the keyword on the specified platform and country.
  4.  Analyze the HTML content returned by the searchWeb tool to find the ranking of the provided URL.
  5.  If the URL is not found in the search results, the ranking should be null.
  6.  Return a list of ranking results, each containing the keyword and its corresponding ranking. Also return the URL of the search result page.

  Input Keywords: {{{keywords}}}
  URL: {{{url}}}
  Platform: {{{platform}}}
  Country: {{{country}}}

  Ensure the output is a JSON array of RankingResultSchema objects.
  `,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const checkKeywordRankingFlow = ai.defineFlow(
  {
    name: 'checkKeywordRankingFlow',
    inputSchema: CheckKeywordRankingInputSchema,
    outputSchema: CheckKeywordRankingOutputSchema,
  },
  async input => {
    const {output} = await checkRankingPrompt(input);
    return output!;
  }
);
