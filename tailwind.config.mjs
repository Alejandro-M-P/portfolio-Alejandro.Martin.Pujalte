export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        carbono: {
          DEFAULT: '#111111',
          low: '#0e0e0e',
          surface: '#0a0a0a',
          mid: '#1c1b1b',
          high: '#2a2a2a',
          highest: '#353534',
        },
        cobalt: {
          DEFAULT: '#0055ff',
          dark: '#0039b3',
          light: '#0066ff',
        },
        text: {
          primary: '#e5e2e1',
          muted: '#c3c5d9',
          faint: '#6b7280',
        },
        warn: '#ffcc00',
        err: '#ff3333',
        bronze: {
          DEFAULT: '#b87333',
          light: '#d4944a',
          dark: '#8a5520',
        },
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        none: '0px',
        DEFAULT: '0px',
      },
    },
  },
}
