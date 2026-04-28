import type { Config } from 'tailwindcss';

/**
 * passare.ch — Design Tokens
 *
 * Philosophie: "Kuratierte Schweizer Deal-Redaktion"
 * — Partners Group × Runway Financial × Editorial Real-Estate
 *
 * Regeln:
 * - Kein Corporate-Blau (keine Commodity-Fintech-Optik)
 * - Warm Off-White statt clinical Weiss
 * - Hairlines statt Shadows
 * - Serif für Editorial-Headlines, Sans für UI + Body
 * - Swiss-Grid mit grosszügigem Whitespace
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Core Brand ───────────────────────────────────
        ink: '#0A0F12',        // Primär-Text — tief, nicht reines Schwarz
        navy: '#0B1F3A',       // Institutional Deep-Navy (Headlines, Nav-Logo)
        bronze: '#B8935A',     // Premium-Akzent (warm Gold/Bronze)
        cream: '#FAF8F3',      // Warm Off-White Background
        paper: '#FFFFFF',      // Surface (Cards)

        // ── Neutrals (nur Graustufen mit warm-Undertone) ─
        stone: '#E8E6E0',      // Hairline-Border 0.5–1px
        fog: '#DDD9D1',        // Etwas dunklere Hairline
        quiet: '#8A9099',      // Tertiär-Text / Captions
        muted: '#5A6471',      // Sekundär-Text

        // ── Status (nur wo nötig, sehr zurückhaltend) ───
        success: '#1F7A4D',    // gedecktes Flaschen-Grün
        warn: '#9A6B1E',       // warm-ocker, nicht gelb
        danger: '#B8322A',     // tiefrot, nicht Ferrari-Rot

        // ── Accent-Varianten ─────────────────────────────
        'bronze-soft': '#E8DCC3',
        'bronze-ink': '#8C6E3D',
        'navy-soft': '#E4E8EF',
      },

      fontFamily: {
        // Fraunces = editorial Display-Serif (variable font, opsz 9–144)
        serif: ['var(--font-serif)', 'Fraunces', 'Tiempos', 'Georgia', 'serif'],
        // Geist = modern Swiss-inspired Sans (variable)
        sans: ['var(--font-sans)', 'Geist', 'Inter', 'system-ui', 'sans-serif'],
        // Geist Mono = für Deal-Zahlen, Tabular-Daten
        mono: ['var(--font-mono)', 'Geist Mono', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        // Display-Scale (clamp-based)
        'display-xl': ['clamp(3.5rem, 8vw, 8rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.75rem, 6vw, 5.5rem)', { lineHeight: '1.02', letterSpacing: '-0.025em' }],
        'display-md': ['clamp(2.25rem, 4.5vw, 4rem)', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        'display-sm': ['clamp(1.75rem, 3.5vw, 2.75rem)', { lineHeight: '1.15', letterSpacing: '-0.015em' }],

        // Headline-Scale (für H2/H3)
        'head-lg': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'head-md': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.005em' }],
        'head-sm': ['1.25rem', { lineHeight: '1.35' }],

        // UI-Scale
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.9375rem', { lineHeight: '1.55' }],
        'caption': ['0.8125rem', { lineHeight: '1.45', letterSpacing: '0.005em' }],
        'overline': ['0.75rem', { lineHeight: '1.3', letterSpacing: '0.12em' }],
      },

      spacing: {
        // Section-Spacings (Swiss-Style, grosszügig)
        'section-y': '8rem',       // 128px desktop
        'section-y-sm': '4rem',    // 64px mobile
      },

      maxWidth: {
        content: '75rem',          // 1200px Haupt-Content
        prose: '42rem',            // 672px Textblöcke
        hero: '60rem',             // 960px Hero-Headlines
        container: '77.5rem',      // 1240px Frame
      },

      borderWidth: {
        hairline: '0.5px',
      },

      borderRadius: {
        pill: '9999px',
        sharp: '2px',
        soft: '6px',
        card: '12px',
      },

      boxShadow: {
        // Sehr dezent, nicht Material-Design
        subtle: '0 1px 2px rgba(10,15,18,0.04), 0 2px 8px rgba(10,15,18,0.03)',
        card: '0 1px 3px rgba(11,31,58,0.05), 0 8px 24px rgba(11,31,58,0.04)',
        lift: '0 2px 4px rgba(11,31,58,0.06), 0 16px 40px rgba(11,31,58,0.08)',
        focus: '0 0 0 3px rgba(184,147,90,0.25)',
      },

      transitionTimingFunction: {
        // Premium Easings
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-out-swift': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },

      animation: {
        'fade-in': 'fadeIn 600ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-up': 'fadeUp 700ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-up-slow': 'fadeUp 1000ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-dot': 'pulseDot 2.2s ease-in-out infinite',
        'progress-slide': 'progressSlide 1.6s cubic-bezier(0.65, 0, 0.35, 1) infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        },
        progressSlide: {
          '0%': { transform: 'translateX(-150%)' },
          '100%': { transform: 'translateX(450%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
