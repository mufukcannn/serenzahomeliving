import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1d1a16",
        porcelain: "#f7f4ef",
        linen: "#e8ded0",
        brass: "#9f7a45",
        olive: "#5f6a52",
        clay: "#b06f51"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"]
      },
      boxShadow: {
        soft: "0 24px 80px rgba(29, 26, 22, 0.11)"
      }
    }
  },
  plugins: []
};

export default config;
