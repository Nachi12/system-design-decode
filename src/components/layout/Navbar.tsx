import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen, Layers, GitCompare, Compass, FileText, Bookmark, Sliders, Calculator, FlaskConical } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Overview', icon: Layers, exact: true },
    { to: '/netflix', label: 'Netflix', icon: BookOpen, accent: 'text-accent-netflix' },
    { to: '/bookmyshow', label: 'BookMyShow', icon: BookOpen, accent: 'text-accent-bms' },
    { to: '/seat-lock-lab', label: 'SeatLock Lab', icon: FlaskConical, accent: 'text-accent-cyan' },
    { to: '/comparison', label: 'Synthesis', icon: GitCompare },
    { to: '/adrs', label: 'ADRs', icon: Sliders },
    { to: '/capacity', label: 'Capacity', icon: Calculator },
    { to: '/glossary', label: 'Glossary', icon: Bookmark },
    { to: '/methodology', label: 'Methodology', icon: Compass },
    { to: '/references', label: 'References', icon: FileText },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-canvas-border bg-canvas-dark/90 backdrop-blur-md">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between w-full h-16">
          {/* Brand mark */}
          <Link
            to="/"
            onClick={closeMobileMenu}
            className="flex items-center gap-2.5 group focus:outline-none min-w-0 flex-1 max-w-[calc(100%-48px)] xl:max-w-none xl:flex-none mr-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-violet to-accent-cyan p-0.5 shadow-md shrink-0">
              <div className="w-full h-full bg-canvas-dark rounded-[6px] flex items-center justify-center font-mono text-xs font-bold text-ink-light group-hover:text-accent-cyan transition-colors">
                SD
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-serif text-sm font-bold tracking-tight text-ink-light group-hover:text-accent-cyan transition-colors sm:hidden">
                Architecture Decoded
              </span>
              <span className="font-serif text-base sm:text-lg font-bold tracking-tight text-ink-light group-hover:text-accent-cyan transition-colors hidden sm:inline truncate">
                System Architecture Decoded
              </span>
              <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-ink-muted -mt-0.5 truncate">
                Engineering Monograph
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (>= xl) */}
          <nav className="hidden xl:flex items-center gap-1 xl:gap-1.5" aria-label="Main Navigation">
            {navLinks.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`px-2.5 py-1.5 rounded-md font-sans text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-canvas-elevated text-ink-light border border-canvas-border shadow-sm'
                      : 'text-ink-muted hover:text-ink-light hover:bg-canvas-surface'
                  }`}
                >
                  <item.icon className={`w-3.5 h-3.5 ${isActive ? 'text-accent-cyan' : ''}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right badge & Mobile/Tablet Menu Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden 2xl:inline-flex items-center font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 rounded border border-canvas-border bg-canvas-surface text-ink-muted">
              v1.0 • Research Edition
            </span>

            {/* Mobile / Tablet hamburger button (< xl) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="xl:hidden p-2 rounded-lg bg-canvas-elevated/80 border border-canvas-border text-ink-light hover:text-accent-cyan hover:bg-canvas-surface focus:outline-none focus:ring-1 focus:ring-accent-violet shrink-0"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-accent-cyan" /> : <Menu className="w-5 h-5 text-ink-light" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Drawer Menu (< xl) */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-canvas-border bg-canvas-surface px-4 pt-2 pb-4 space-y-1 animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobileMenu}
                className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
                  isActive
                    ? 'bg-canvas-elevated text-ink-light border border-canvas-border font-semibold'
                    : 'text-ink-muted hover:text-ink-light hover:bg-canvas-dark'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-accent-cyan' : ''}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </header>
  );
};
