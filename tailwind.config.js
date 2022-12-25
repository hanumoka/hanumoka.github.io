/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/pages/**/*.{js,jsx,ts,tsx}', './src/components/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // Tailwindcss 3.0 default is 'media',  'class'
  theme: {
    extend: {},
  },
};
