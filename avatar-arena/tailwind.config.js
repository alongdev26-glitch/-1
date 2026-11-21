/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,html}'],
  theme: {
    // המסכים של Stitch משתמשים ב-sm/md/lg לפי רוחב החלון. הבמה שלנו קבועה (960x540),
    // לכן כל הנקודות הופכות לאותו ערך והמסך נראה תמיד כמו בעיצוב.
    screens: { sm: '0px', md: '0px', lg: '0px' },
    extend: {
      // פלטת מסך הסיפור (הקוד של Stitch מניח טוקנים כאלה בלי להגדיר אותם, לכן הגדרתי אותם כאן)
      colors: {
        background: '#0f1320', surface: '#0f1320',
        'surface-container-lowest': '#0a0d17', 'surface-container-low': '#161b2a', 'surface-container': '#1a2030',
        'surface-container-high': '#242b3c', 'surface-container-highest': '#2f3649', 'surface-bright': '#363d52', 'surface-variant': '#3a4155',
        'on-surface': '#e1e4f0', 'on-surface-variant': '#c3c7d6', outline: '#8d92a3', 'outline-variant': '#454b5f',
        primary: '#ffb779', 'primary-container': '#f0a868', 'primary-fixed': '#ffdcc1', 'primary-fixed-dim': '#ffb779',
        'on-primary': '#4a2800', 'on-primary-container': '#5a3300',
        secondary: '#b5c4ff', 'secondary-container': '#354476', 'secondary-fixed': '#dce1ff', 'secondary-fixed-dim': '#b5c4ff', 'on-secondary': '#1b2d62',
        tertiary: '#ffb59d', 'tertiary-container': '#c5492d', 'on-tertiary-container': '#ffffff',
        error: '#ffb4ab', 'error-container': '#93000a', 'on-error-container': '#ffdad6',
      },
      fontSize: {
        'headline-lg': ['26px', { lineHeight: '32px', fontWeight: '800' }], 'headline-md': ['20px', { lineHeight: '26px', fontWeight: '700' }],
        'title-md': ['15px', { lineHeight: '20px', fontWeight: '700' }], 'body-md': ['13px', { lineHeight: '18px' }], 'body-sm': ['11px', { lineHeight: '15px' }],
        'label-lg': ['13px', { lineHeight: '16px', fontWeight: '700' }], 'label-md': ['11px', { lineHeight: '14px', fontWeight: '700' }],
      },
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
