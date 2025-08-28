import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* Global top logos header */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 glass-card border-0 shadow-md px-4 py-2 rounded-full flex items-center gap-3">
          <img src="/mainlogo.png" alt="M.AI.N" className="h-12 w-auto" />
          <span className="text-muted-foreground">×</span>
          <img src="/Utlik_LogoBlack.png" alt="Utlik" className="h-6 w-auto" />
        </div>
        <div className="pb-28 sm:pb-24">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        {/* Global footer - full-width bottom bar without pill */}
        <footer className="fixed bottom-0 left-0 right-0 z-30">
          <div className="w-full bg-background/80 backdrop-blur-md border-t px-4 py-2 text-center text-xs sm:text-sm text-muted-foreground">
            <span className="mr-1">Разработано с любовью в</span>
            <a
              href="https://www.linkedin.com/in/utlik/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Utlik. Co
            </a>
            <span className="mx-1">&</span>
            <a
              href="https://t.me/maincomby"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-4 hover:text-foreground transition-colors"
            >
              M.AI.N — AI Community
            </a>
          </div>
        </footer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
