'use server';

/**
 * @fileOverview A keyword rank checker and analysis AI agent.
 *
 * - checkKeywordRanking - A function that handles the keyword ranking and related keyword analysis process.
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
  searchResultPage: z.string().url().describe('The URL of the search engine result page (e.g., https://www.google.com/search?q=keyword%20phrase&gl=US). Must be a valid, URL-encoded string.'),
});

const RelatedKeywordMetricsSchema = z.object({
  relatedKeyword: z.string().describe('A keyword related to the original input.'),
  competition: z.enum(['High', 'Medium', 'Low', 'N/A']).describe('Estimated competition level for this keyword (High, Medium, Low, or N/A if unknown). This should be a string.'),
  searchVolume: z.string().describe('Estimated monthly search volume. Prefer specific numbers or ranges (e.g., "Approx. 500-600/month", "1K-10K/month"). Descriptive terms like "Very High (100k+/month)", "Low (<100/month)" are acceptable if exact numbers are not possible. Use "N/A" if undetermined.'),
  last30DaysSearches: z.string().describe('Estimated number or trend of searches in the last 30 days. Prefer specific numbers or ranges (e.g., "Approx. 1.5K searches", "Approx. 5000-6000 searches"). If specific numbers are not determinable, use trend descriptions like "Increased", "Stable", "Decreased". Use "N/A" if undetermined.'),
  last24HoursSearches: z.string().describe('Estimated number or trend of searches in the last 24 hours. Prefer specific numbers or ranges (e.g., "Approx. 50 searches", "Approx. 100-150 searches"). If specific numbers are not determinable, use activity descriptions like "High activity", "Low activity". Use "N/A" if undetermined.'),
});

const CheckKeywordRankingOutputSchema = z.object({
  originalKeywordRankings: z.array(RankingResultSchema).describe("Ranking results for the originally provided keywords."),
  relatedKeywordSuggestions: z.array(RelatedKeywordMetricsSchema).optional().describe("Suggestions for 5-6 related keywords with their estimated metrics. This might be empty if no relevant suggestions are found."),
});
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
      country: z.string().default('US').describe('The target country for the search (e.g., US, GB).'),
    }),
    outputSchema: z.string().describe('HTML content of the search results or an error/info message.'),
  },
  async (input) => {
    const { query, platform, country } = input;

    if (platform.toLowerCase() !== 'google') {
      console.log(`Simulating web search for ${query} on ${platform} in ${country} (using placeholder).`);
      // More detailed placeholder for non-Google platforms
      return `<html><body>
        <h1>Search Results for ${query} (Placeholder on ${platform})</h1>
        <p>Platform '${platform}' is not supported by live search. This is placeholder data.</p>
        <ol>
          <li><p><strong>Rank: 1</strong></p><p><a href="https://example.com/placeholder-rank1-${encodeURIComponent(query)}">Placeholder Top Result for ${query} on ${platform}</a></p><p>This is a simulated top ranking result for your query on ${platform}.</p><p><small>URL: https://example.com/placeholder-rank1-${encodeURIComponent(query)}</small></p></li>
          <li><p><strong>Rank: 2</strong></p><p><a href="https://another-example.com/placeholder-rank2-${encodeURIComponent(query)}">Placeholder Second Result for ${query} on ${platform}</a></p><p>Another simulated search result, indicating some competition or related content.</p><p><small>URL: https://another-example.com/placeholder-rank2-${encodeURIComponent(query)}</small></p></li>
          <li><p><strong>Rank: 3</strong></p><p><a href="https://yet-another-example.com/placeholder-rank3-${encodeURIComponent(query)}">Placeholder Third Result for ${query} on ${platform}</a></p><p>Further simulated content to provide some ranking context.</p><p><small>URL: https://yet-another-example.com/placeholder-rank3-${encodeURIComponent(query)}</small></p></li>
        </ol>
      </body></html>`;
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

    if (!apiKey || apiKey === "YOUR_GOOGLE_API_KEY_HERE" || apiKey.trim() === "") {
      console.error('GOOGLE_API_KEY is not set or is set to placeholder in environment variables.');
      return '<html><body><h3>Configuration Error</h3><p>Google API Key (GOOGLE_API_KEY) is not configured or is set to a placeholder value in the backend. Please set it in the .env file.</p><p>Example: GOOGLE_API_KEY=AIzaSyCIZOyOhkFI7eMD_FrjNQD2Sq1HSKB9two</p></body></html>';
    }
    if (!cx || cx === "YOUR_CUSTOM_SEARCH_ENGINE_ID_HERE" || cx.trim() === "") {
      console.error('GOOGLE_CUSTOM_SEARCH_ENGINE_ID is not set or is set to placeholder in environment variables.');
      return '<html><body><h3>Configuration Error</h3><p>Google Custom Search Engine ID (GOOGLE_CUSTOM_SEARCH_ENGINE_ID) is not configured or is set to a placeholder value in the backend. Please set it in the .env file (e.g., GOOGLE_CUSTOM_SEARCH_ENGINE_ID=YOUR_CX_ID_FROM_GOOGLE_CSE). Without it, Google search will not work.</p></body></html>';
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
  prompt: `You are an expert SEO analyst. Your task is two-fold:
  1. Determine the ranking of a list of original keywords on a specified search engine.
  2. Provide a list of 5-6 related keywords along with their estimated competition, search volume, and recent search trends.

  The user will provide a list of keywords.
  Platform: {{{platform}}}
  Country: {{{country}}}
  Input Keywords: {{{keywords}}}

  Here's how you should proceed:

  PART 1: Original Keyword Ranking
  1.  Split the input keywords string into a list of individual keywords.
  2.  For each original keyword:
      a.  Use the searchWeb tool to search for the keyword on the specified platform and country. The tool will return HTML content.
      b.  Analyze the HTML content. The HTML will contain a list of search results, each with a "Rank", "URL", "Title", and "Snippet".
      c.  Identify the highest-ranking or most relevant search result. Extract its numerical position (from "Rank: N"), its full URL (from "URL: http..."), and the URL of the search engine results page you conceptually visited. This URL must be properly formed: for a keyword like "best budget laptop" and country "US" on Google, it would be "https://www.google.com/search?q=best%20budget%20laptop&gl=US". For other platforms, construct a similar, valid URL (e.g., for Bing: "https://www.bing.com/search?q=best%20budget%20laptop&cc=US"). Ensure any spaces or special characters in the keyword part of the URL are URL-encoded (e.g., space becomes %20).
      d.  If the HTML indicates "No results found" or an error (such as "Configuration Error" or "API Error" messages within the HTML), or if ranking cannot be determined, 'ranking' and 'rankedUrl' should be null for that keyword. The 'searchResultPage' should still be the conceptual search URL, correctly URL-encoded. For example, if the original keyword was "learn javascript" and country was "CA", the searchResultPage should be "https://www.google.com/search?q=learn%20javascript&gl=CA" (or the equivalent for other platforms).
  3.  Compile these findings into the 'originalKeywordRankings' array.

  PART 2: Related Keyword Suggestions & Metrics
  1.  Based on the overall context of the input keywords and the search results from Part 1 (even if some searches failed or returned errors), generate a list of 5-6 distinct related keywords that could be valuable for the user. If Part 1 yielded errors for all keywords (e.g., due to a configuration issue), rely on your general SEO knowledge about the input keywords.
  2.  For each of these *related* keywords, provide the following estimations. Base these estimations on your general SEO knowledge and, if applicable, insights from any searchWeb tool usage. These are estimates, not exact figures.
      a.  'relatedKeyword': The related keyword itself.
      b.  'competition': Estimate the competition level as 'High', 'Medium', or 'Low'. If you cannot determine, use 'N/A'. This should be a string value.
      c.  'searchVolume': Estimate the monthly search volume. Prefer specific numbers or ranges (e.g., "Approx. 500-600/month", "1K-10K/month"). Descriptive terms like "Very High (100k+/month)", "Low (<100/month)" are acceptable if exact numbers are not possible. Use "N/A" if undetermined.
      d.  'last30DaysSearches': Estimate the search volume or trend over the last 30 days. Prefer specific numbers or ranges (e.g., "Approx. 1.5K searches", "Approx. 5000-6000 searches"). If specific numbers are not determinable, use trend descriptions like "Increased", "Stable", "Decreased". Use "N/A" if undetermined.
      e.  'last24HoursSearches': Estimate the search volume or trend over the last 24 hours. Prefer specific numbers or ranges (e.g., "Approx. 50 searches", "Approx. 100-150 searches"). If specific numbers are not determinable, use activity descriptions like "High activity", "Low activity". Use "N/A" if undetermined.
  3.  Compile these findings into the 'relatedKeywordSuggestions' array. If no relevant suggestions can be made, this array can be empty or omitted.

  Output Format:
  Ensure the output is a single JSON object strictly conforming to the CheckKeywordRankingOutputSchema.
  The object must contain 'originalKeywordRankings' (an array, possibly empty).
  'relatedKeywordSuggestions' is optional but preferred; if provided, it must be an array (possibly empty).
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
      if (history && history.length > 0) {
        const lastInteraction = history[history.length - 1];
        // Attempt to stringify safely, handling potential circular references or large objects
        let lastInteractionStr = 'Could not stringify last interaction.';
        try {
          lastInteractionStr = JSON.stringify(lastInteraction, null, 2);
        } catch (e) {
          console.error("Error stringifying last history interaction:", e);
        }
        console.error("Flow Error: No output from checkRankingPrompt. Last interaction:", lastInteractionStr);
      } else {
        console.error("Flow Error: No output from checkRankingPrompt. History is empty or undefined.");
      }
      // Return a default structure if output is null/undefined to satisfy schema
      return {
        originalKeywordRankings: [],
        relatedKeywordSuggestions: [],
      };
    }

    // Ensure output itself exists and then access properties safely
    const rankings = (output && output.originalKeywordRankings) ? output.originalKeywordRankings : [];
    const suggestions = (output && output.relatedKeywordSuggestions) ? output.relatedKeywordSuggestions : [];
    
    return {
        originalKeywordRankings: rankings,
        relatedKeywordSuggestions: suggestions,
    };
  }
);

