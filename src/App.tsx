import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ReadingProgress } from './components/layout/ReadingProgress';
import { OverviewPage } from './pages/OverviewPage';

// Lazy-loaded research modules for optimal bundle splitting and fast initial page load
const NetflixPage = lazy(() => import('./pages/NetflixPage').then(m => ({ default: m.NetflixPage })));
const BookMyShowPage = lazy(() => import('./pages/BookMyShowPage').then(m => ({ default: m.BookMyShowPage })));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage').then(m => ({ default: m.ComparisonPage })));
const AdrPage = lazy(() => import('./pages/AdrPage').then(m => ({ default: m.AdrPage })));
const CapacityPage = lazy(() => import('./pages/CapacityPage').then(m => ({ default: m.CapacityPage })));
const MethodologyPage = lazy(() => import('./pages/MethodologyPage').then(m => ({ default: m.MethodologyPage })));
const GlossaryPage = lazy(() => import('./pages/GlossaryPage').then(m => ({ default: m.GlossaryPage })));
const ReferencesPage = lazy(() => import('./pages/ReferencesPage').then(m => ({ default: m.ReferencesPage })));
const SeatLockLabPage = lazy(() => import('./pages/SeatLockLabPage').then(m => ({ default: m.SeatLockLabPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3 animate-in fade-in duration-150">
    <div className="w-8 h-8 rounded-full border-2 border-accent-cyan/20 border-t-accent-cyan animate-spin" />
    <span className="font-mono text-xs text-ink-muted">Loading research module...</span>
  </div>
);

export const App: React.FC = () => {
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-canvas-dark text-ink-light font-sans antialiased overflow-x-hidden selection:bg-accent-violet/30 selection:text-white">
      {/* Scroll Reading Progress Bar */}
      <ReadingProgress />

      {/* Global Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/netflix" element={<NetflixPage />} />
            <Route path="/bookmyshow" element={<BookMyShowPage />} />
            <Route path="/seat-lock-lab" element={<SeatLockLabPage />} />
            <Route path="/comparison" element={<ComparisonPage />} />
            <Route path="/adrs" element={<AdrPage />} />
            <Route path="/capacity" element={<CapacityPage />} />
            <Route path="/methodology" element={<MethodologyPage />} />
            <Route path="/glossary" element={<GlossaryPage />} />
            <Route path="/references" element={<ReferencesPage />} />
            {/* Catch-all redirect to Home */}
            <Route path="*" element={<OverviewPage />} />
          </Routes>
        </Suspense>
      </main>

      {/* Global Monograph Footer */}
      <Footer />
    </div>
  );
};
