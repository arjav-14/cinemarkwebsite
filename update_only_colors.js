const fs = require('fs');

let html = fs.readFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', 'utf8');

// 1. Update the CSS variables for accents to match the gold logo
html = html.replace(/--velvet:\s*#[0-9a-fA-F]+;/g, '--velvet: #D6B553;');
html = html.replace(/--magenta:\s*#[0-9a-fA-F]+;/g, '--magenta: #D6B553;');
html = html.replace(/--gold:\s*#[0-9a-fA-F]+;/g, '--gold: #D6B553;');

// 2. Update the radial-gradients (the glowing blobs) from magenta/purple to gold
html = html.replace(/rgba\(224,\s*68,\s*123,/g, 'rgba(214, 181, 83,'); // Old magenta glow
html = html.replace(/rgba\(179,\s*30,\s*61,/g, 'rgba(214, 181, 83,'); // Old red glow
html = html.replace(/rgba\(201,\s*162,\s*39,/g, 'rgba(214, 181, 83,'); // Old mismatching gold

fs.writeFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', html);
console.log('Successfully updated only the colors to gold!');
