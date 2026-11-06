// נבנה ל-tailwind.css עם: npx tailwindcss@3.4.17 -c tailwind.config.cjs -i tailwind.src.css -o tailwind.css --minify
module.exports = {
  content: ['./index.html', './game.js', './icons.js'],
  theme: { extend: {
    fontFamily: { sans: ['Rubik', 'system-ui', 'sans-serif'], display: ['Secular One', 'Rubik', 'sans-serif'] },
  } },
};
