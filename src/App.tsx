import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BookingProvider } from "./context/BookingContext";
import Index from "./pages/Index";
import DateTimePage from "./pages/DateTimePage";
import ReviewPage from "./pages/ReviewPage";
import NotFound from "./pages/NotFound";
import QuickLinkDropdown from './components/ui/quicklink-dropdown';
import JobChat from './components/ui/job-chat';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BookingProvider>
        <Toaster />
        <Sonner />
          {/* App-level quicklinks in top-right */}
          <div className="fixed top-4 right-4 z-50">
            <QuickLinkDropdown />
          </div>
          {/* Job chat popup */}
          <JobChat />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/book/date-time" element={<DateTimePage />} />
            <Route path="/book/review" element={<ReviewPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </BookingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
