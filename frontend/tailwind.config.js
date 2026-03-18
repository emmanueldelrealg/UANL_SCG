/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html","./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",input: "hsl(var(--input))",ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))",foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))",foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))",foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))",foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))",foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))",foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))",foreground: "hsl(var(--card-foreground))" },
        navy: { 50:'#f0f4ff',100:'#e0e8ff',200:'#c7d5fe',300:'#a5b8fd',400:'#8191fa',500:'#6366f1',600:'#1e3a5f',700:'#1a3050',800:'#152640',900:'#0f1b2d' },
        gold: { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#92400e',900:'#78350f' },
      },
      borderRadius: { lg: "var(--radius)",md: "calc(var(--radius) - 2px)",sm: "calc(var(--radius) - 4px)" },
      animation: { "accordion-down": "accordion-down 0.2s ease-out","accordion-up": "accordion-up 0.2s ease-out","spin-slow": "spin 3s linear infinite" },
      keyframes: {
        "accordion-down": { from: { height: "0" },to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" },to: { height: "0" } },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
