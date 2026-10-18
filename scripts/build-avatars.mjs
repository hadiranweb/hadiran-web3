// Eight original, lightweight vector portraits. Fixed artwork only; no user-supplied SVG or external assets.
import { mkdirSync, writeFileSync } from "node:fs";
const styles = [
  ["#e2f3ee", "#127e77", "#243d45", "#d6a37c"], ["#eee9df", "#7b604b", "#303e4a", "#a97255"],
  ["#e5eafa", "#425a99", "#263345", "#e1b99c"], ["#f3e7d8", "#8b6743", "#273f41", "#c9916c"],
  ["#dfefee", "#37625e", "#4e3934", "#e3b090"], ["#ece7f2", "#655575", "#363448", "#9c674e"],
  ["#f0eadb", "#826d35", "#383e3b", "#c48c67"], ["#dfeaf0", "#335c73", "#293b46", "#e6bda0"],
];
const hair = [
  'M35 49V40c0-21 30-27 35-7 8 0 10 8 8 17l-9-15-14 8-17 2z',
  'M32 54V39c0-25 36-28 42-5l5 30-11 1-1-26-24 1-1 27-11-3z',
  'M35 46c-5-8 0-27 15-27 12-4 25 4 25 18l-6 8-8-12-25 10z',
  'M32 57V38c0-21 42-25 43 3l2 19-9-6-1-17-25 3-1 20z',
  'M34 49V37c0-17 32-25 39-7l3 15-9-7-11 3-14-5-1 14z',
  'M29 59V40c0-28 43-29 48-4l3 28-14-3 2-22-25-1-1 26z',
  'M35 43c-4-13 4-23 18-23 17-2 25 12 21 25l-8-10-24 2-1 11z',
  'M32 56V39c0-23 37-28 43-3l4 26-11-2-2-22-23 2-1 22z',
];
mkdirSync('public/avatars', { recursive: true });
styles.forEach(([bg,coat,hairColor,skin],i) => {
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112" fill="none"><rect width="112" height="112" rx="56" fill="${bg}"/><path d="M17 112c0-25 14-39 39-39s39 14 39 39" fill="${coat}"/><path d="M47 69h18v16l-9 10-9-10z" fill="${skin}"/><path d="M35 47c0-19 39-20 40 0v11c0 15-10 23-20 23S35 72 35 58z" fill="${skin}"/><path d="${hair[i]}" fill="${hairColor}"/><path d="M48 58v2m15-2v2" stroke="${hairColor}" stroke-width="3" stroke-linecap="round"/><path d="M51 70c3 2 7 2 10 0" stroke="${hairColor}" stroke-width="2" stroke-linecap="round"/><path d="M${i%2 ? '43 84l13 14 13-14' : '46 83l10 12 10-12'}" stroke="${bg}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${i===2||i===6 ? `<path d="M42 55h12v10H42zm16 0h12v10H58zm-4 3h4" stroke="${hairColor}" stroke-width="2" stroke-linejoin="round"/>` : ''}</svg>`;
 writeFileSync(`public/avatars/avatar-${String(i+1).padStart(2,'0')}.svg`,svg+'\n');
});
console.log('Generated 8 original local SVG avatars.');
