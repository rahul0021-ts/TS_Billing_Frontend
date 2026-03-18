/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          ink: {
            50: "#f8fafc",
            200: "#cbd5f5",
            400: "#94a3b8",
            600: "#475569",
            700: "#334155",
            800: "#1e293b",
            900: "#0f172a"
          },
          primary: {
            400: "#1D9E75",
            600: "#085041"
          }
        },
        fontFamily: {
          body: ["Inter", "sans-serif"],
          mono: ["JetBrains Mono", "monospace"]
        },
        animation: {
          "slide-in": "slideIn 0.25s ease-out"
        },
        keyframes: {
          slideIn: {
            "0%": { transform: "translateY(20px)", opacity: 0 },
            "100%": { transform: "translateY(0)", opacity: 1 }
          }
        }
      },
    },
    plugins: [],
  }