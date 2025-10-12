/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      colors: {
        ink: {
          900: "#05070b",
          800: "#090d14",
          700: "#0c111a",
          600: "#111826"
        },
        neon: {
          cyan: "#7dd3fc",
          pink: "#f0abfc",
          mint: "#99f6e4"
        }
      },
      boxShadow: {
        glass: "0 1px 0 rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)"
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: []
}
