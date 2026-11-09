const fs = require('fs');
const html = fs.readFileSync('danailab_homepage.html', 'utf8');

// Find all <style> contents or linked css
const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]);
console.log('Number of style tags:', styles.length);
if (styles.length > 0) {
  const allCss = styles.join('\n');
  console.log('Total inline CSS length:', allCss.length);
  // Extract CSS variables / theme
  const rootVars = allCss.match(/:root\s*\{([\s\S]*?)\}/i)?.[1];
  console.log('\n--- ROOT CSS VARIABLES ---');
  console.log(rootVars ? rootVars.trim().slice(0, 1500) : 'None found');

  // Check font-family
  const fontMatches = [...allCss.matchAll(/font-family:\s*([^;]+);/gi)].map(m => m[1].trim());
  console.log('\n--- FONT FAMILIES ---', [...new Set(fontMatches)]);

  // Check key selectors
  const selectors = ['body', 'header', '.button', '.hero', '.card', 'nav', 'footer'];
  selectors.forEach(sel => {
    const m = allCss.match(new RegExp(`(?:^|[}\\s])${sel.replace('.', '\\.')}\\s*\\{([^}]+)\\}`, 'i'));
    if (m) {
      console.log(`\nRule for ${sel}:`, m[1].trim().replace(/\s+/g, ' '));
    }
  });
}

// Find external css links
const links = [...html.matchAll(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
console.log('\n--- LINKED STYLESHEETS ---', links);

