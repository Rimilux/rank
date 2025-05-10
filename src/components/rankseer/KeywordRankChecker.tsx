// @ts-nocheck
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Loader2, Search, AlertCircle, ExternalLink, TrendingUp, ListChecks, Globe, Laptop, Link as LinkIcon, Tags, Flame, ActivitySquare, ShieldCheck, UsersRound, CalendarDays, Clock, BarChartBig, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


import { checkKeywordRanking, type CheckKeywordRankingInput, type CheckKeywordRankingOutput } from "@/ai/flows/check-keyword-ranking";
import { PLATFORMS, COUNTRIES } from "@/lib/constants";

const FormSchema = z.object({
  keywords: z.string().min(1, "Please enter at least one keyword.").describe("Comma-separated list of keywords"),
  platform: z.string().default("google"),
  country: z.string().default("US"),
});

type FormValues = z.infer<typeof FormSchema>;

export function KeywordRankChecker() {
  const [analysisResults, setAnalysisResults] = React.useState<CheckKeywordRankingOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      keywords: "",
      platform: "google",
      country: "US",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResults(null);

    try {
      const result = await checkKeywordRanking(data);
      setAnalysisResults(result);
      if (!result.originalKeywordRankings?.length && !result.relatedKeywordSuggestions?.length) {
        toast({
          title: "No results",
          description: "No ranking information or related keywords found.",
        });
      } else {
         toast({
          title: "Analysis Complete!",
          description: "Keyword ranking and suggestion check finished.",
        });
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to perform keyword analysis: ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Keyword Analyzer</CardTitle>
          <CardDescription>
            Enter keywords to check rankings and discover related keyword opportunities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" />Keywords</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., best travel destinations, budget travel tips, solo female travel"
                        className="min-h-[100px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a comma-separated list of keywords.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Laptop className="h-5 w-5 text-primary" />Platform</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PLATFORMS.map((platform) => (
                            <SelectItem key={platform.value} value={platform.value}>
                              {platform.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" />Country</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Analyze Keywords
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="shadow-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResults?.originalKeywordRankings && analysisResults.originalKeywordRankings.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary"/>Original Keyword Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead className="text-center">Ranking</TableHead>
                  <TableHead>Ranked URL</TableHead>
                  <TableHead>Search Result Page</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisResults.originalKeywordRankings.map((result, index) => (
                  <TableRow key={`original-${index}`}>
                    <TableCell className="font-medium">{result.keyword}</TableCell>
                    <TableCell className="text-center">
                      {result.ranking !== null ? (
                         <span className="font-bold text-lg text-primary">{result.ranking}</span>
                      ) : (
                        <span className="text-muted-foreground">Not Found</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.rankedUrl ? (
                        <a
                          href={result.rankedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 break-all"
                        >
                           <LinkIcon className="h-4 w-4 flex-shrink-0" /> <span className="truncate max-w-xs">{result.rankedUrl}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <a
                        href={result.searchResultPage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        View Page <ExternalLink className="h-4 w-4" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {analysisResults?.relatedKeywordSuggestions && analysisResults.relatedKeywordSuggestions.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Tags className="h-6 w-6 text-primary"/>Related Keyword Opportunities
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <Info className="h-4 w-4" />
              <span>Estimated metrics for related keywords.</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Related Keyword</TableHead>
                  <TableHead className="text-center">Competition</TableHead>
                  <TableHead>Est. Search Volume</TableHead>
                  <TableHead>Est. 30-Day Searches</TableHead>
                  <TableHead>Est. 24-Hour Searches</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisResults.relatedKeywordSuggestions.map((result, index) => (
                  <TableRow key={`related-${index}`}>
                    <TableCell className="font-medium">{result.relatedKeyword}</TableCell>
                    <TableCell className="text-center">
                       <span className={
                        result.competition === 'High' ? 'text-destructive font-medium' :
                        result.competition === 'Medium' ? 'text-yellow-600 font-medium' :
                        result.competition === 'Low' ? 'text-green-600 font-medium' :
                        'text-muted-foreground'
                       }>{result.competition}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <BarChartBig className="h-4 w-4 text-muted-foreground flex-shrink-0" /> 
                        <span>{result.searchVolume || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>{result.last30DaysSearches || 'N/A'}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>{result.last24HoursSearches || 'N/A'}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {analysisResults && !analysisResults.originalKeywordRankings?.length && !analysisResults.relatedKeywordSuggestions?.length && !isLoading && !error && (
         <Card className="shadow-md">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">No data found for the provided keywords and options. Try different keywords or broaden your search.</p>
            </CardContent>
          </Card>
      )}

    </div>
  );
}
