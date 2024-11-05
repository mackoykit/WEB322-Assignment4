/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [`./views/**/*.ejs`],
  theme: {
    container: {
      center: true,
    },
    extend: {},
  },
  daisyui: {
    themes: ["corporate"],
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
};
