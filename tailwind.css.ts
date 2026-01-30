import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your custom colors
        'custom-pink': '#FFF0F0',
        'custom-yellow': '#FFFBEB',
        'custom-violet': '#F5F3FF',
      },
    },
  },
  plugins: [],
};
export default config;