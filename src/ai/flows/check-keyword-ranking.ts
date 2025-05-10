'use server';

/**
 * @fileOverview A keyword rank checker AI agent.
 *
 * - checkKeywordRanking - A function that handles the keyword ranking process.
 * - CheckKeywordRankingInput - The input type for the checkKeywordRanking function.
 * - CheckKeywordRankingOutput - The return type for the checkKeywordRanking function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckKeywordRankingInputSchema = z.object({
  keywords: z.string().describe('A comma-separated list of keywords to check ranking for.'),
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
    .describe('The position of the highest-ranking or most relevant search result for the keyword. Null if not found or ranking cannot be determined.'),
  rankedUrl: z
    .string()
    .url()
    .nullable()
    .describe('The URL of the content that achieved the reported ranking. Null if ranking is null.'),
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
    // Placeholder implementation for web search. Replace with actual search API call.
    // This implementation returns a canned response that includes the query and some example links.
    console.log(`Simulating web search for ${input.query} on ${input.platform} in ${input.country}`);
    // const searchResultPage = `https://www.example.com/search?q=${encodeURIComponent(input.query)}`; // This is what the AI should return as searchResultPage
    // Simulate a page with a few results
    return `<html><body>
      <h1>Search Results for ${input.query}</h1>
      <p>This is a simulated search result page. Results for '${input.query}' are below:</p>
      <ol>
        <li><a href="https://example.com/article1-for-${encodeURIComponent(input.query)}">Top Article about ${input.query}</a> - Some description.</li>
        <li><a href="https://another-site.com/resource-on-${encodeURIComponent(input.query)}">Helpful Resource on ${input.query}</a> - More details.</li>
        <li><a href="https://someblog.blogspot.com/blogpost-on-${encodeURIComponent(input.query)}">Blog post on ${input.query} on someblog.blogspot.com</a> - A blog entry.</li>
      </ol>
    </body></html>`;
  }
);

const checkRankingPrompt = ai.definePrompt({
  name: 'checkRankingPrompt',
  tools: [searchWeb],
  input: {schema: CheckKeywordRankingInputSchema},
  output: {schema: CheckKeywordRankingOutputSchema},
  prompt: `You are an expert SEO analyst tasked with determining the ranking of a list of keywords on a specified search engine.

  The user will provide a list of keywords.
  Your job is to find the ranking information for each keyword by using the searchWeb tool and return a list of ranking results.

  Here's how you should proceed:

  1.  Split the keywords string into a list of individual keywords.
  2.  For each keyword:
  3.  Use the searchWeb tool to search for the keyword on the specified platform and country.
  4.  Analyze the HTML content returned by the searchWeb tool. For each keyword, identify the highest-ranking or most relevant search result. Determine its numerical position (ranking) and its full URL (rankedUrl). The searchResultPage should be the URL of the search engine results page you conceptually visited.
  5.  If no relevant results are found or ranking cannot be determined, both 'ranking' and 'rankedUrl' should be null.
  6.  Return a list of ranking results, each containing the keyword, its corresponding ranking, the rankedUrl, and the URL of the search result page.

  Input Keywords: {{{keywords}}}
  Platform: {{{platform}}}
  Country: {{{country}}}

  Ensure the output is a JSON array of RankingResultSchema objects.
  Each object in the array should conform to this structure:
  - keyword: The keyword being checked.
  - ranking: The numerical position (e.g., 1, 2, 3) of the highest-ranking or most relevant result. Null if not found.
  - rankedUrl: The full URL of the content that achieved this ranking. Null if ranking is null.
  - searchResultPage: The URL of the search engine results page (e.g., https://www.google.com/search?q=...).
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

