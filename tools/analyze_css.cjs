const fs = require('fs');
const css = fs.readFileSync('danailab_styles.css', 'utf8');

console.log('CSS length:', css.length);

// Extract root variables
const rootVars = css.match(/:root\s*\{([\s\S]*?)\}/gi);
if (rootVars) {
  rootVars.forEach((rv, i) => {
    console.log(`\n--- ROOT BLOCK ${i + 1} ---`);
    console.log(rv.slice(0, 1000));
  });
}

// Extract colors
const colors = [...css.matchAll(/--(?:color|bg|fg|text|primary|accent|border|surface)[^:]*:\s*([^;]+);/gi)]
  .map(m => m[0]);
console.log('\n--- COLOR & THEME VARIABLES (first 25) ---');
console.log(colors.slice(0, 25));

// Extract font definitions
const fonts = [...css.matchAll(/font-family:\s*([^;]+);/gi)].map(m => m[1]);
console.log('\n--- FONT FAMILIES ---');
console.log([...new Set(fonts)]);

// Extract button classes
const buttonStyles = [...css.matchAll(/\.button[^{]*\{([^}]+)\}/gi)].map(m => m[0]);
console.log('\n--- BUTTON RULES ---');
console.log(buttonStyles.slice(0, 8));

// Extract media queries
const mediaQueries = [...css.matchAll(/@media[^{]+\{/gi)].map(m => m[0]);
console.log('\n--- MEDIA QUERIES (sample) ---');
console.log([...new Set(mediaQueries)].slice(0, 10));

