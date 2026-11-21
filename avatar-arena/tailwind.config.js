/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,html}'],
  theme: {
    // המסכים של Stitch משתמשים ב-sm/md/lg לפי רוחב החלון. הבמה שלנו קבועה (960x540),
    // לכן כל הנקודות הופכות לאותו ערך והמסך נראה תמיד כמו בעיצוב.
    screens: { sm: '0px', md: '0px', lg: '0px' },
    extend: {
      // פלטת מסך הסיפור (הקוד של Stitch מניח טוקנים כאלה בלי להגדיר אותם, לכן הגדרתי אותם כאן)
      // הצבעים הם משתני CSS: כל ממלכה בסיפור מגדירה פלטה משלה (src/ui/styles.css)
      colors: {
        'background': 'rgb(var(--c-background) / <alpha-value>)',
        'surface': 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-container-lowest': 'rgb(var(--c-surface-container-lowest) / <alpha-value>)',
        'surface-container-low': 'rgb(var(--c-surface-container-low) / <alpha-value>)',
        'surface-container': 'rgb(var(--c-surface-container) / <alpha-value>)',
        'surface-container-high': 'rgb(var(--c-surface-container-high) / <alpha-value>)',
        'surface-container-highest': 'rgb(var(--c-surface-container-highest) / <alpha-value>)',
        'surface-bright': 'rgb(var(--c-surface-bright) / <alpha-value>)',
        'surface-variant': 'rgb(var(--c-surface-variant) / <alpha-value>)',
        'on-surface': 'rgb(var(--c-on-surface) / <alpha-value>)',
        'on-surface-variant': 'rgb(var(--c-on-surface-variant) / <alpha-value>)',
        'outline': 'rgb(var(--c-outline) / <alpha-value>)',
        'outline-variant': 'rgb(var(--c-outline-variant) / <alpha-value>)',
        'primary': 'rgb(var(--c-primary) / <alpha-value>)',
        'primary-container': 'rgb(var(--c-primary-container) / <alpha-value>)',
        'primary-fixed': 'rgb(var(--c-primary-fixed) / <alpha-value>)',
        'primary-fixed-dim': 'rgb(var(--c-primary-fixed-dim) / <alpha-value>)',
        'on-primary': 'rgb(var(--c-on-primary) / <alpha-value>)',
        'on-primary-container': 'rgb(var(--c-on-primary-container) / <alpha-value>)',
        'secondary': 'rgb(var(--c-secondary) / <alpha-value>)',
        'secondary-container': 'rgb(var(--c-secondary-container) / <alpha-value>)',
        'secondary-fixed': 'rgb(var(--c-secondary-fixed) / <alpha-value>)',
        'secondary-fixed-dim': 'rgb(var(--c-secondary-fixed-dim) / <alpha-value>)',
        'on-secondary': 'rgb(var(--c-on-secondary) / <alpha-value>)',
        'tertiary': 'rgb(var(--c-tertiary) / <alpha-value>)',
        'tertiary-container': 'rgb(var(--c-tertiary-container) / <alpha-value>)',
        'on-tertiary-container': 'rgb(var(--c-on-tertiary-container) / <alpha-value>)',
        'error': 'rgb(var(--c-error) / <alpha-value>)',
        'error-container': 'rgb(var(--c-error-container) / <alpha-value>)',
        'on-error-container': 'rgb(var(--c-on-error-container) / <alpha-value>)',
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
