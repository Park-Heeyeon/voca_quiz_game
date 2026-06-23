import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#58cc02", dark: "#46a302" },
        secondary: { DEFAULT: "#1cb0f6", dark: "#1899d6" },
        success: "#58cc02",
        danger: "#ff4b4b",
        muted: "#afafaf",
        customBlueColor: "#61acc5",
        customDepBlueColor: "#2794B9",
        customGrayColor: "#babbbb",
        customDepGrayColor: "#818789",
      },
      boxShadow: {
        "btn-3d": "0 4px 0 0 rgba(0,0,0,0.15)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
