import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#1A56DB",
          foreground: "#ffffff",
          50: "#EBF0FD",
          100: "#C5D3F9",
          600: "#1A56DB",
          700: "#1547BF",
          800: "#103899",
        },
        success: {
          DEFAULT: "#0E9F6E",
          50: "#E8F7F2",
          100: "#C2EBD9",
        },
        danger: {
          DEFAULT: "#E02424",
          50: "#FEF0F0",
          100: "#FCD4D4",
        },
        warning: {
          DEFAULT: "#D97706",
          50: "#FEF9EB",
          100: "#FDE9B1",
        },
        neutral: {
          50: "#F8F9FA",
          100: "#F1F3F5",
          200: "#E9ECEF",
          300: "#DEE2E6",
          400: "#CED4DA",
          500: "#ADB5BD",
          600: "#6C757D",
          700: "#495057",
          800: "#343A40",
          900: "#212529",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px 0 rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px 0 rgba(0,0,0,0.08), 0 1px 3px 0 rgba(0,0,0,0.05)",
        dropdown: "0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
