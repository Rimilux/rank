"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Loader2, Search, AlertCircle, ExternalLink, TrendingUp, ListChecks, Globe, Laptop } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

import { checkKeywordRanking, type CheckKeywordRankingInput, type CheckKeywordRankingOutput } from "@/ai/flows/check-keyword-ranking";
import { PLATFORMS, COUNTRIES } from "@/lib/constants";

const FormSchema = z.object({
  keywords: z.string().min(1, "Please enter at least one keyword.").describe("Comma-separated list of keywords"),
  url: z.string().url("Please enter a valid URL.").describe("Blogger website URL"),
  platform: z.string().default("google"),
  country: z.string().default("US"),
});

type FormValues = z.infer<typeof FormSchema>;

export function KeywordRankChecker() {
  const [rankingResults, setRankingResults] = React.useState<CheckKeywordRankingOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      keywords: "",
      url: "",
      platform: "google",
      country: "US",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setRankingResults(null);

    try {
      const result = await checkKeywordRanking(data);
      setRankingResults(result);
      if (result.length === 0) {
        toast({
          title: "No results",
          description: "No ranking information found for the given keywords and URL.",
        });
      } else {
         toast({
          title: "Success!",
          description: "Keyword ranking check completed.",
        });
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to check keyword ranking: ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Keyword Rank Checker</CardTitle>
          <CardDescription>
            Enter your keywords, Blogger URL, and select platform/country to check rankings.
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

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><ExternalLink className="h-5 w-5 text-primary" />Blogger URL</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., https://yourblog.blogspot.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      The URL of your Blogger website (e.g. example.blogspot.com or a custom domain).
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
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Check Rankings
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

      {rankingResults && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary"/>Ranking Results</CardTitle>
          </CardHeader>
          <CardContent>
            {rankingResults.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead className="text-center">Ranking</TableHead>
                    <TableHead>Search Result Page</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankingResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{result.keyword}</TableCell>
                      <TableCell className="text-center">
                        {result.ranking !== null ? (
                           <span className="font-bold text-lg text-primary">{result.ranking}</span>
                        ) : (
                          <span className="text-muted-foreground">Not Found</span>
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
            ) : (
              <p className="text-muted-foreground text-center py-4">No ranking data to display for the current inputs.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
