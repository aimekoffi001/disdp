const fs = require('fs');
const html = fs.readFileSync('danailab_homepage.html', 'utf8');

// Inspect Nav
const nav = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i)?.[0];
console.log('--- NAV ---');
console.log(nav ? nav.replace(/\s+/g, ' ').slice(0, 500) : 'No nav found');

// Inspect Hero Section
const hero = html.match(/<section[^>]*class=["'][^"']*hero[^"']*["'][^>]*>([\s\S]*?)<\/section>/i)?.[0]
  || html.match(/<div[^>]*class=["'][^"']*hero[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[0];
console.log('\n--- HERO ---');
console.log(hero ? hero.replace(/\s+/g, ' ').slice(0, 800) : 'No hero found');

// Inspect Footer
const footer = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i)?.[0];
console.log('\n--- FOOTER ---');
console.log(footer ? footer.replace(/\s+/g, ' ').slice(0, 500) : 'No footer found');

