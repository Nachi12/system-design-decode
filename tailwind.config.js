/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          dark: '#080B11',
          surface: '#0F1420',
          elevated: '#171E2E',
          border: '#242F46',
          borderSubtle: '#1A2234',
        },
        paper: {
          light: '#FBFBF9',
          surface: '#F4F3EE',
          elevated: '#ECEAE4',
          border: '#DDD9CE',
          borderSubtle: '#EAE7DF',
        },
        accent: {
          cyan: '#06B6D4',
          cyanDim: '#0891B2',
          violet: '#8B5CF6',
          violetDim: '#7C3AED',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
          netflix: '#E50914',
          bms: '#F84464',
        },
        ink: {
          dark: '#0B0F19',
          light: '#F8FAFC',
          muted: '#94A3B8',
          faint: '#64748B',
        }
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'Charter', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '68ch',
          },
        },
      },
    },
  },
  plugins: [],
}
