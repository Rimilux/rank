import { KeywordRankChecker } from "@/components/rankseer/KeywordRankChecker";

// Using an inline SVG for the logo as a simple Target icon
const RankseerLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

export default function RankseerPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="py-4 md:py-6 shadow-md bg-card border-b border-border">
        <div className="container mx-auto flex items-center gap-3 px-4">
          <RankseerLogo />
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Rankseer</h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-2">
            Discover Your Keyword Rankings
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Analyze keyword performance across various search platforms and countries with ease.
          </p>
        </div>
        <KeywordRankChecker />
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border mt-auto">
        <p>&copy; {new Date().getFullYear()} Rankseer. Built with passion.</p>
      </footer>
    </div>
  );
}
