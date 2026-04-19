/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        carbono: '#050505',
        'carbono-light': '#0A0A0A',
        cobalt: '#0055FF',
        'cobalt-light': '#0066FF',
        white: '#FFFFFF',
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        none: '0px',
      },
    },
  },
  plugins: [],
}