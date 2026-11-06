// אייקונים כקוד SVG, במקום אימוג'י. כל פונקציה מקבלת מחלקות CSS (גודל וצבע).
const svg = (cls, body, vb = '0 0 24 24') => `<svg class="${cls} inline-block shrink-0 align-middle" viewBox="${vb}" aria-hidden="true">${body}</svg>`;

export const I = {
  coin: (c = 'w-4 h-4') => svg(c, '<circle cx="12" cy="12" r="10" fill="#f7ba13" stroke="#b37300" stroke-width="1.5"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#fff3a8" stroke-width="1.6"/><path d="M12 8.5v7M10 10.2c.6-.7 3.4-.9 3.4.6 0 1.7-3.4.9-3.4 2.7 0 1.4 2.8 1.2 3.6.4" fill="none" stroke="#b37300" stroke-width="1.3" stroke-linecap="round"/>'),
  gem: (c = 'w-4 h-4') => svg(c, '<path d="M6 3h12l4 6-10 12L2 9z" fill="#2de2e6" stroke="#00798a" stroke-width="1.4" stroke-linejoin="round"/><path d="M2 9h20M9 3l-2 6 5 12 5-12-2-6" fill="none" stroke="#c9fbff" stroke-width="1.1" stroke-linejoin="round"/>'),
  bolt: (c = 'w-4 h-4') => svg(c, '<path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6.3z" fill="#ffd000" stroke="#d48800" stroke-width="1.3" stroke-linejoin="round"/>'),
  trophy: (c = 'w-4 h-4') => svg(c, '<path d="M7 3h10v5a5 5 0 0 1-10 0z" fill="#ffc933" stroke="#c98a00" stroke-width="1.4" stroke-linejoin="round"/><path d="M7 5H3.5c0 3 1.5 4.5 3.7 4.8M17 5h3.5c0 3-1.5 4.5-3.7 4.8" fill="none" stroke="#c98a00" stroke-width="1.5" stroke-linecap="round"/><path d="M12 13v4M8 21h8M9 17h6" fill="none" stroke="#c98a00" stroke-width="1.8" stroke-linecap="round"/>'),
  heart: (c = 'w-4 h-4') => svg(c, '<path d="M12 21s-8.5-5.2-8.5-11.2A4.8 4.8 0 0 1 12 7.2a4.8 4.8 0 0 1 8.5 2.6C20.5 15.8 12 21 12 21z" fill="currentColor"/>'),
  check: (c = 'w-4 h-4') => svg(c, '<path d="M4.5 12.8 9.5 18 19.5 6.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'),
  cross: (c = 'w-4 h-4') => svg(c, '<path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>'),
  gift: (c = 'w-8 h-8') => svg(c, '<rect x="3" y="9" width="18" height="12" rx="1.5" fill="#ff7ab8"/><rect x="2" y="6" width="20" height="4.5" rx="1.5" fill="#ff9ccc"/><path d="M12 6v15" stroke="#fff" stroke-width="2.4"/><path d="M12 6C9 6 7 4.8 7.6 3.4 8.6 1.6 11.4 3.2 12 6zm0 0c3 0 5-1.2 4.4-2.6C15.4 1.6 12.6 3.2 12 6z" fill="#fff"/>'),
  spark: (c = 'w-4 h-4') => svg(c, '<path d="M12 1.5c.7 5.2 3.3 7.8 8.5 10.5-5.2 2.7-7.8 5.3-8.5 10.5C11.3 17.3 8.700 14.700 3.500 12 8.700 9.300 11.300 6.700 12 1.500z" fill="currentColor"/>'),
  smile: (c = 'w-6 h-6') => svg(c, '<circle cx="12" cy="12" r="9.5" fill="#ffd34d" stroke="#c98a00" stroke-width="1.4"/><circle cx="8.8" cy="10" r="1.4" fill="#5a2a00"/><circle cx="15.2" cy="10" r="1.4" fill="#5a2a00"/><path d="M7.8 14.2c1 2.2 7.400 2.200 8.400 0" fill="none" stroke="#5a2a00" stroke-width="1.6" stroke-linecap="round"/>'),
};
