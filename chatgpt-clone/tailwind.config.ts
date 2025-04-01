import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms'; // Keep forms plugin if it was intended

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'], // Configure content sources
  theme: {
    extend: {}, // Add custom theme extensions here
  },
  plugins: [
    typography, // Add the typography plugin
    forms // Include forms plugin if needed
  ],
} satisfies Config;
