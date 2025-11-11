import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SearchProvider } from "@/lib/search-context";
import { ErrorBoundary } from "react-error-boundary";
import { ContentPageErrorBoundary } from "@/components/error/ContentPageErrorBoundary";
import Index from "./pages/Index";
import AlumniRoom from "./pages/AlumniRoom";
import PublicationsRoom from "./pages/PublicationsRoom";
import PhotosRoom from "./pages/PhotosRoom";
import FacultyRoom from "./pages/FacultyRoom";
import SearchTest from "./pages/SearchTest";
import BoardTest from "./pages/BoardTest";
import FPSValidationTest from "./pages/FPSValidationTest";
import FullscreenSearchPage from "./pages/FullscreenSearchPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-red-600 mb-4">Application Error</h2>
        <p className="text-gray-700 mb-4">Something went wrong:</p>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto mb-4">
          {error.message}
        </pre>
        <button
          onClick={resetErrorBoundary}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

const App = () => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SearchProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route 
                path="/alumni" 
                element={
                  <ContentPageErrorBoundary 
                    contentType="alumni"
                    onReturnHome={() => window.location.href = '/'}
                  >
                    <AlumniRoom onNavigateHome={() => window.location.href = '/'} />
                  </ContentPageErrorBoundary>
                } 
              />
              <Route 
                path="/publications" 
                element={
                  <ContentPageErrorBoundary 
                    contentType="publication"
                    onReturnHome={() => window.location.href = '/'}
                  >
                    <PublicationsRoom onNavigateHome={() => window.location.href = '/'} />
                  </ContentPageErrorBoundary>
                } 
              />
              <Route 
                path="/photos" 
                element={
                  <ContentPageErrorBoundary 
                    contentType="photo"
                    onReturnHome={() => window.location.href = '/'}
                  >
                    <PhotosRoom onNavigateHome={() => window.location.href = '/'} />
                  </ContentPageErrorBoundary>
                } 
              />
              <Route 
                path="/faculty" 
                element={
                  <ContentPageErrorBoundary 
                    contentType="faculty"
                    onReturnHome={() => window.location.href = '/'}
                  >
                    <FacultyRoom onNavigateHome={() => window.location.href = '/'} />
                  </ContentPageErrorBoundary>
                } 
              />
              <Route path="/search" element={<FullscreenSearchPage />} />
              <Route path="/search-test" element={<SearchTest />} />
              <Route path="/board-test" element={<BoardTest />} />
              <Route path="/fps-validation-test" element={<FPSValidationTest />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SearchProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
