import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms'; // Keep forms plugin if it was intended

import defaultTheme from 'tailwindcss/defaultTheme'; // Import default theme for fallbacks

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'], // Configure content sources
  theme: {
    // Directly define fontFamily, overriding the default
    fontFamily: {
      // Set 'Noto Sans KR' as the primary sans-serif font
      // Include default sans stack as fallbacks
      sans: ['"Noto Sans KR"', ...defaultTheme.fontFamily.sans],
      // Keep other default families (serif, mono) if needed, or define them too
      serif: [...defaultTheme.fontFamily.serif],
      mono: [...defaultTheme.fontFamily.mono],
    },
    extend: {
      typography: ({ theme }: { theme: Function }) => ({
        DEFAULT: { // Customizes the base 'prose' class
          css: {
            // Set body text color (matches the one applied directly in MessageBubble)
            '--tw-prose-body': '#d7c0a3',
            // Set bold text color
            '--tw-prose-bold': '#b08354', // This is already the desired color
            // Keep other relevant colors for dark theme consistent
            '--tw-prose-headings': theme('colors.neutral.200'), // Lighter for headings
            '--tw-prose-links': theme('colors.blue.400'), // Keep links blue for now
            '--tw-prose-code': theme('colors.pink.300'),
            '--tw-prose-pre-code': theme('colors.pink.300'),
            '--tw-prose-pre-bg': 'rgba(0, 0, 0, 0.2)',
            '--tw-prose-quotes': theme('colors.neutral.300'),
            '--tw-prose-quote-borders': theme('colors.neutral.600'),
            '--tw-prose-captions': theme('colors.neutral.400'),
            '--tw-prose-hr': theme('colors.neutral.700'),
            '--tw-prose-bullets': theme('colors.neutral.400'),
            '--tw-prose-counters': theme('colors.neutral.400'),
            // Add other variables if needed
          },
        },
      }),
    },
  },
  plugins: [
    typography, // Add the typography plugin
    forms // Include forms plugin if needed
  ],
} satisfies Config;
