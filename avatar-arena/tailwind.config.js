/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,html}'],
  theme: {
    // המסכים של Stitch משתמשים ב-sm/md/lg לפי רוחב החלון. הבמה שלנו קבועה (960x540),
    // לכן כל הנקודות הופכות לאותו ערך והמסך נראה תמיד כמו בעיצוב.
    screens: { sm: '0px', md: '0px', lg: '0px' },
    extend: {
      fontFamily: {
        sans: ['Rubik', 'Heebo', 'Assistant', 'sans-serif'],
        rubik: ['Rubik', 'sans-serif'],
        heebo: ['Heebo', 'sans-serif'],
        assistant: ['Assistant', 'Rubik', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
