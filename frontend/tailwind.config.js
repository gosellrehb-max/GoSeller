/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/utils/**/*.{js,ts,jsx,tsx,mdx}',
    './src/contexts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0053E2',
          50: '#EAF1FF',
          100: '#D5E4FF',
          200: '#ABC8FF',
          500: '#0053E2', // Main brand blue
          600: '#0047C4',
          700: '#003CA6',
          800: '#003188',
          900: '#00266A',
        },
        /** Walmart-adjacent neutrals + link blue (shopper UI); brand CTAs stay `primary` */
        wm: {
          page: '#ffffff',
          bar: '#f8f8f8',
          border: '#e5e5e5',
          link: '#0071dc',
          linkHover: '#004f9a',
          ink: '#2e2f32',
          muted: '#74767c',
        },
        teal: {
          500: '#14B8A6',
          600: '#0D9488',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        }
      },
      boxShadow: {
        wm: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        'wm-md': '0 4px 12px rgb(0 0 0 / 0.08)',
      },
      fontFamily: {
        sans: [
          'EverydaySans',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
