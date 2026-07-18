/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    container: { center: true, padding: '1rem' },
    extend: {
      colors: {
        background: { DEFAULT: 'var(--background)' },
        foreground: { DEFAULT: 'var(--foreground)' },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        border: { DEFAULT: 'var(--border)' },
        input: { DEFAULT: 'var(--input)' },
        ring: { DEFAULT: 'var(--ring)' },
        gap: { DEFAULT: 'var(--gap-color)' },
        contradiction: { DEFAULT: 'var(--contradiction-color)' },
        outdated: { DEFAULT: 'var(--outdated-color)' },
        success: { DEFAULT: 'var(--success-color)' },
        indigo: {
          DEFAULT: 'var(--indigo)',
          light: 'var(--indigo-light)',
        },
        teal: {
          DEFAULT: 'var(--teal)',
          light: 'var(--teal-light)',
        },
        amber: {
          DEFAULT: 'var(--amber)',
          light: 'var(--amber-light)',
        },
        coral: {
          DEFAULT: 'var(--coral)',
          light: 'var(--coral-light)',
        },
        purple: {
          DEFAULT: 'var(--purple)',
          light: 'var(--purple-light)',
        },
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'calc(var(--radius) - 4px)',
        md: 'var(--radius)',
        lg: 'calc(var(--radius) + 4px)',
        xl: 'calc(var(--radius) + 8px)',
        '2xl': 'calc(var(--radius) + 16px)',
      },
      fontFamily: {
        sans: ['DM Sans', '-apple-system', 'SF Pro Text', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        'glow-primary': 'var(--glow-primary)',
        glass: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
        'glass-elevated': '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        DEFAULT: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        thinking: 'thinking 1.5s ease-in-out infinite',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'fade-in': 'fadeIn 0.25s ease forwards',
        'spring-in': 'springIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'status-pulse': 'statusPulse 1.5s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        thinking: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.95)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        springIn: {
          from: { opacity: '0', transform: 'scale(0.9) translateY(20px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        bounceIn: {
          from: { opacity: '0', transform: 'scale(0.7)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        statusPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(79,70,229,0.4)' },
          '50%': { boxShadow: '0 0 0 6px rgba(79,70,229,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};