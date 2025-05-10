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
    .describe('The platform or search engine to check ranking on (e.g., google, youtube). Currently, only "google" is actively supported with live data.'),
  country: z.string().default('US').describe('The target country for the search (e.g., US, GB).'),
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
  searchResultPage: z.string().url().describe('The URL of the search engine result page.'),
});

const CheckKeywordRankingOutputSchema = z.array(RankingResultSchema);
export type CheckKeywordRankingOutput = z.infer<typeof CheckKeywordRankingOutputSchema>;

export async function checkKeywordRanking(input: CheckKeywordRankingInput): Promise<CheckKeywordRankingOutput> {
  return checkKeywordRankingFlow(input);
}

const searchWeb = ai.defineTool(
  {
    name: 'searchWeb',
    description: 'Searches the web for a given query using Google Custom Search API and returns the HTML content of the search results page. ONLY Google platform is supported for live search.',
    inputSchema: z.object({
      query: z.string().describe('The search query.'),
      platform: z
        .string()
        .default('google')
        .describe('The platform or search engine to check ranking on. Currently, only "google" is supported for live search.'),
      country: z.string().default('US').describe('The target country for the search (e.g., US, GB). Used as "gl" parameter for Google.'),
    }),
    outputSchema: z.string().describe('HTML content of the search results or an error/info message.'),
  },
  async (input) => {
    const { query, platform, country } = input;

    if (platform.toLowerCase() !== 'google') {
      // Fallback to placeholder for non-Google platforms as per original behavior for now
      console.log(`Simulating web search for ${query} on ${platform} in ${country} (using placeholder).`);
      return `<html><body>
        <h1>Search Results for ${query} (Placeholder)</h1>
        <p>Platform '${platform}' is not supported by live search. This is placeholder data.</p>
        <ol>
          <li><a href="https://example.com/article1-for-${encodeURIComponent(query)}">Placeholder Top Article about ${query}</a> - Some description.</li>
          <li><a href="https://another-site.com/resource-on-${encodeURIComponent(query)}">Placeholder Helpful Resource on ${query}</a> - More details.</li>
        </ol>
      </body></html>`;
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

    if (!apiKey) {
      console.error('GOOGLE_API_KEY is not set in environment variables.');
      return '<html><body><h3>Configuration Error</h3><p>Google API Key (GOOGLE_API_KEY) is not configured in the backend. Please contact the administrator.</p></body></html>';
    }
    if (!cx || cx === "YOUR_CUSTOM_SEARCH_ENGINE_ID_HERE") {
      console.error('GOOGLE_CUSTOM_SEARCH_ENGINE_ID is not set or is set to placeholder in environment variables.');
      return '<html><body><h3>Configuration Error</h3><p>Google Custom Search Engine ID (GOOGLE_CUSTOM_SEARCH_ENGINE_ID) is not configured or is set to a placeholder value in the backend. Please contact the administrator or update it in the .env file if you are the administrator.</p></body></html>';
    }

    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&gl=${country.toLowerCase()}&num=20`; // Get top 20 results

    try {
      console.log(`Performing live Google search for: "${query}" in country: ${country}`);
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google Search API request failed: ${response.status} ${response.statusText}`, errorText);
        return `<html><body><h3>API Error</h3><p>Failed to fetch search results from Google. Status: ${response.status}. Details: ${errorText}</p></body></html>`;
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return `<html><body>
          <h1>Search Results for ${query}</h1>
          <p>No results found for '${query}' on Google in ${country}.</p>
        </body></html>`;
      }

      const resultsHtml = data.items.map((item: any, index: number) =>
        `<li>
           <p><strong>Rank: ${index + 1}</strong></p>
           <p><a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a></p>
           <p>${item.snippet}</p>
           <p><small>URL: ${item.link}</small></p>
         </li>`
      ).join('');

      return `<html><body>
        <h1>Search Results for ${query}</h1>
        <p>Displaying top ${data.items.length} results for '${query}' on Google in ${country}:</p>
        <ol>${resultsHtml}</ol>
      </body></html>`;

    } catch (error: any) {
      console.error('Error during web search tool execution:', error);
      return `<html><body><h3>Execution Error</h3><p>An exception occurred while trying to fetch search results: ${error.message || 'Unknown error'}</p></body></html>`;
    }
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
  3.  Use the searchWeb tool to search for the keyword on the specified platform and country. The tool will return HTML content.
  4.  Analyze the HTML content returned by the searchWeb tool. The HTML will contain a list of search results, each with a "Rank", "URL", "Title", and "Snippet".
      For each keyword, identify the highest-ranking or most relevant search result. Extract its numerical position (from "Rank: N"), its full URL (from "URL: http..."), and the URL of the search engine results page you conceptually visited to get these results (e.g., "https://www.google.com/search?q=yourquery&gl=US").
  5.  If the HTML indicates "No results found" or an error, or if ranking cannot be determined from the HTML, both 'ranking' and 'rankedUrl' should be null for that keyword. The 'searchResultPage' should still be the conceptual search URL.
  6.  Return a list of ranking results, each containing the keyword, its corresponding ranking, the rankedUrl, and the URL of the search result page.

  Input Keywords: {{{keywords}}}
  Platform: {{{platform}}}
  Country: {{{country}}}

  Ensure the output is a JSON array of RankingResultSchema objects.
  Each object in the array should conform to this structure:
  - keyword: The keyword being checked.
  - ranking: The numerical position (e.g., 1, 2, 3) of the highest-ranking or most relevant result. Null if not found or error.
  - rankedUrl: The full URL of the content that achieved this ranking. Null if ranking is null or error.
  - searchResultPage: The URL of the search engine results page (e.g., https://www.google.com/search?q=...).
  `,
  config: {
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
  async (input: CheckKeywordRankingInput) => {
    const {output, history} = await checkRankingPrompt(input);
    if (!output) {
      console.error("Flow Error: No output from checkRankingPrompt. History:", JSON.stringify(history, null, 2));
      // Potentially return an empty array or throw, depending on desired error handling for the caller
      // For now, returning empty array if output is null/undefined to satisfy schema
      return [];
    }
    return output;
  }
);
