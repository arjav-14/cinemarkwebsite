const fs = require('fs');

let html = fs.readFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', 'utf8');

const replacements = {
  // Purplish blacks to neutral pure blacks/greys
  '#0d0a0f': '#050505', // Base
  '#160f1a': '#0a0a0a', // Surfaces
  '#1d1420': '#111111', // Elevated
  '#150d17': '#080808', // Footer/Cards
  '#140b16': '#030303', // Inputs
  
  // Purplish greys to neutral greys
  '#241621': '#1c1c1c', // Borders
  '#2a1a26': '#222222', // Hover borders
  '#5a4a56': '#444444', // Lighter borders

  // Red/velvet shades to dark gold shades (to maintain depth)
  '#7a1128': '#b89531', // Dark gold
  '#8f1730': '#94751f', // Darker gold
  '#6a0f22': '#665011'  // Deepest gold
};

for (const [oldColor, newColor] of Object.entries(replacements)) {
  const regex = new RegExp(oldColor, 'gi');
  html = html.replace(regex, newColor);
}

// Ensure primary CSS variables are gold instead of red
html = html.replace(/--velvet:\s*#[0-9a-fA-F]+;/g, '--velvet: #D6B553;');
html = html.replace(/--magenta:\s*#[0-9a-fA-F]+;/g, '--magenta: #D6B553;');
html = html.replace(/--gold:\s*#[0-9a-fA-F]+;/g, '--gold: #D6B553;');

// Replace glowing blobs from magenta/purple to gold
html = html.replace(/rgba\(224,\s*68,\s*123,/g, 'rgba(214, 181, 83,'); // Old magenta
html = html.replace(/rgba\(179,\s*30,\s*61,/g, 'rgba(214, 181, 83,'); // Old velvet red
html = html.replace(/rgba\(201,\s*162,\s*39,/g, 'rgba(214, 181, 83,'); // Old mismatching gold

fs.writeFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', html);
console.log('Successfully eliminated all traces of purple and red!');
