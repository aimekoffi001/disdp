const fs = require('fs');
const html = fs.readFileSync('danailab_homepage.html', 'utf8');

console.log('--- META INFO ---');
console.log('Title:', html.match(/<title>(.*?)<\/title>/i)?.[1]);
console.log('Meta Description:', html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i)?.[1]);
console.log('Meta Viewport:', html.match(/<meta\s+name=["']viewport["']\s+content=["'](.*?)["']/i)?.[1]);

// Fonts & Stylesheets
const fonts = [...html.matchAll(/href=["'](https:\/\/(?:fonts\.googleapis\.com|use\.typekit\.net)[^"']+)["']/gi)].map(m => m[1]);
console.log('\n--- EXTERNAL FONTS / CSS ---', fonts);

// Framework / Generator
const generator = html.match(/<meta\s+name=["']generator["']\s+content=["'](.*?)["']/i)?.[1];
console.log('Generator / CMS:', generator);

// Headings
const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
console.log('\n--- H1 HEADINGS ---', h1s);

const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
console.log('\n--- H2 HEADINGS ---', h2s);

const h3s = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
console.log('\n--- H3 HEADINGS (first 10) ---', h3s.slice(0, 10));

// CTA & Buttons
const buttons = [...html.matchAll(/<(?:button|a)[^>]*class=["']([^"']*(?:btn|button|cta|action)[^"']*)["'][^>]*>([\s\S]*?)<\/(?:button|a)>/gi)]
  .map(m => ({ class: m[1], text: m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() }))
  .filter(b => b.text.length > 0);
console.log('\n--- CTAs & BUTTONS (sample) ---', buttons.slice(0, 10));

// Colors and styles sample
const inlineStyles = [...html.matchAll(/style=["']([^"']+)["']/gi)].map(m => m[1]).slice(0, 15);
console.log('\n--- INLINE STYLES SAMPLE ---', inlineStyles);
