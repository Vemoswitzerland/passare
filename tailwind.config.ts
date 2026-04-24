import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Passare Brand-Palette (edel, vertrauensvoll, CH-modern)
        cream: '#F7F2EA',        // Hintergrund warm
        deep: '#0E2A2B',         // Primary dark (Petrol-Tanne)
        terra: '#B54A2B',        // Akzent warm (Ton CH-Erde)
        sand: '#E3D4BD',         // Sekundär neutral
        lightmid: '#C9BFAE',     // Mittelton
        gold: '#C8A352',         // Premium-Gold für Pro-Tier
        forest: '#1E4A3F',       // Support-Grün
        ink: '#0A0F0F',          // Text dark
        paper: '#FFFFFF',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Cormorant Garamond', 'serif'],
        sans: ['var(--font-sans)', 'Outfit', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        'screen-xl': '1280px',
        'screen-2xl': '1440px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};

export default config;
