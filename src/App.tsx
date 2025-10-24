import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { Results } from "./pages/Results";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* Global top logos header - mobile optimized */}
        <div className="fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 z-50 glass-card border-0 shadow-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-2 sm:gap-3">
          <img src="/mainlogo.png" alt="M.AI.N" className="h-8 sm:h-10 md:h-12 w-auto" />
          <span className="text-sm sm:text-base text-muted-foreground">×</span>
          <img src="/Utlik_LogoBlack.png" alt="Utlik" className="h-4 sm:h-5 md:h-6 w-auto" />
        </div>
        <div className="">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/results/:auditNumber" element={<Results />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        {/* Global footer - mobile optimized, single line */}
        <footer className="fixed bottom-0 left-0 right-0 z-20">
          <div className="w-full bg-background/90 backdrop-blur-md border-t px-2 sm:px-4 py-1 sm:py-2 text-center text-xs text-muted-foreground">
            <div className="flex items-center justify-center gap-1 whitespace-nowrap overflow-hidden">
              <span className="hidden sm:inline">Разработано с любовью в</span>
              <span className="sm:hidden">© </span>
              <a
                href="https://www.linkedin.com/in/utlik/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4 hover:text-foreground transition-colors"
              >
                Utlik. Co
              </a>
              <span>&</span>
              <a
                href="https://t.me/maincomby"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4 hover:text-foreground transition-colors"
              >
                M.AI.N
              </a>
            </div>
          </div>
        </footer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
