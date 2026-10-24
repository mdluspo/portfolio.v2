import {pinPlacements} from '../animations/pin-motion.js';
const svg = body => `<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
export const technologies = [
  {name:'TypeScript',symbol:'TS',tone:'#79959d',shape:'square'},
  {name:'JavaScript',symbol:'JS',tone:'#c8b76e',shape:'square'},
  {name:'HTML5',symbol:'5',tone:'#c18a63',shape:'shield'},
  {name:'CSS3',symbol:'3',tone:'#7798af',shape:'shield'},
  {name:'React',tone:'#83a8a7',icon:svg('<ellipse cx="16" cy="16" rx="13" ry="5"/><ellipse cx="16" cy="16" rx="13" ry="5" transform="rotate(60 16 16)"/><ellipse cx="16" cy="16" rx="13" ry="5" transform="rotate(120 16 16)"/><circle cx="16" cy="16" r="2" fill="currentColor" stroke="none"/>')},
  {name:'Next.js',symbol:'N',tone:'#b5b5a7'},
  {name:'Node.js',symbol:'N',tone:'#8eaa77',shape:'hex'},
  {name:'Tailwind CSS',tone:'#83a5a8',icon:svg('<path d="M3 13q4-9 12-3 7 6 14-1-4 10-13 4-7-5-13 0ZM3 23q4-9 12-3 7 6 14-1-4 10-13 4-7-5-13 0Z" fill="currentColor" stroke="none"/>')},
  {name:'shadcn/ui',tone:'#b9b9aa',shape:'square',icon:svg('<path d="m8 24 15-15M16 25l9-9" stroke-width="2.8"/>')},
  {name:'Zod',symbol:'Z',tone:'#829aaa',shape:'shield'},
  {name:'Terminal',tone:'#a5b090',shape:'square',icon:svg('<path d="m7 10 7 6-7 6M17 23h8"/>')},
  {name:'Git',tone:'#bd896a',shape:'diamond',icon:svg('<path d="M11 6v16a3 3 0 0 0 6 0V12l6 6M11 11h6"/><circle cx="11" cy="7" r="2" fill="currentColor"/><circle cx="23" cy="18" r="2" fill="currentColor"/>')},
  {name:'GitHub',tone:'#aaa99b',icon:svg('<path d="M11 27v-5c-5 1-6-2-7-3m17 8v-5c0-2-1-3-1-3 5-1 7-3 7-7 0-2-1-3-2-4 0-1 0-3-1-4-3 0-5 2-5 2-3-1-5-1-8 0 0 0-2-2-5-2-1 1-1 3-1 4-1 1-2 2-2 4 0 4 2 6 7 7 0 0-1 1-1 3"/>')},
  {name:'Vercel',tone:'#bfc0ad',icon:svg('<path d="m16 5 12 21H4Z" fill="currentColor" stroke="none"/>')}
];

export function renderPins() {
  return technologies.map((tech,i)=>{
    const [x,y,angle,scale]=pinPlacements[i];
    return `<span class="tech-pin pin-${tech.shape||'round'}" data-tech="${i}" style="--enamel:${tech.tone};--pin-x:${x}%;--pin-y:${y}%;--pin-tilt:${angle}deg;--pin-scale:${scale};z-index:${i%3}"><span class="pin-face">${tech.icon||`<span class="pin-symbol">${tech.symbol}</span>`}</span><span class="pin-label">${tech.name}</span></span>`;
  }).join('');
}

export function renderTechnologyList() {
  return technologies.map((tech,i)=>`<li data-tech-item="${i}"><span class="stack-swatch" style="--enamel:${tech.tone}">${tech.icon||tech.symbol}</span>${tech.name}</li>`).join('');
}
