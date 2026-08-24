import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard", "system-ui", "sans-serif"],
        display: ["Fredoka", "Pretendard", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#6C4DF6",
          dark: "#5639E0",
          soft: "#EDE9FF",
        },
        coral: "#FF6B5A",
        mint: "#16C79A",
        amber: "#FFC247",
        ink: {
          DEFAULT: "#221B4E",
          soft: "#6B6593",
        },
        cloud: "#F6F4FF",
        line: "#E7E3F7",
        danger: "#FF4D6D",
      },
      boxShadow: {
        "btn-brand": "0 5px 0 0 #5639E0",
        "btn-mint": "0 5px 0 0 #0E9E7C",
        "btn-coral": "0 5px 0 0 #E04C3C",
        "btn-light": "0 5px 0 0 #D9D3F2",
        card: "0 18px 40px -16px rgba(76, 53, 184, 0.30)",
        "card-sm": "0 10px 24px -12px rgba(76, 53, 184, 0.25)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "28px",
      },
      keyframes: {
        "float-card": {
          "0%, 100%": { transform: "translateY(0) rotate(-6deg)" },
          "50%": { transform: "translateY(-12px) rotate(-6deg)" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.92)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "float-card": "float-card 5s ease-in-out infinite",
        "pop-in": "pop-in 0.25s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
