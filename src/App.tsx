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
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        {/* Global footer */}
        <footer
          className="fixed bottom-4 left-1/2 -translate-x-1/2 glass-card border-0 shadow-md px-4 py-2 rounded-full text-xs sm:text-sm text-muted-foreground"
        >
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
        </footer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
