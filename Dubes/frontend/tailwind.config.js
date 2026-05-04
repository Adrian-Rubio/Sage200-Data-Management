/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(222.2, 84%, 4.9%)",
        foreground: "hsl(210, 40%, 98%)",
        primary: {
          DEFAULT: "hsl(217.2, 91.2%, 59.8%)",
          foreground: "hsl(222.2, 47.4%, 11.2%)",
        },
        secondary: {
          DEFAULT: "hsl(217.2, 32.6%, 17.5%)",
          foreground: "hsl(210, 40%, 98%)",
        },
        card: {
          DEFAULT: "hsl(222.2, 84%, 4.9%)",
          foreground: "hsl(210, 40%, 98%)",
        },
        accent: {
          DEFAULT: "hsl(210, 40%, 96.1%)",
          foreground: "hsl(222.2, 47.4%, 11.2%)",
        },
        muted: {
          DEFAULT: "hsl(217.2, 32.6%, 17.5%)",
          foreground: "hsl(215, 20.2%, 65.1%)",
        },
        border: "hsl(217.2, 32.6%, 17.5%)",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
    },
  },
  plugins: [],
}
