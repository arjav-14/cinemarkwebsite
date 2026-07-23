const fs = require('fs');

let html = fs.readFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', 'utf8');

// Update background colors to neutral/warm black instead of purple tint
html = html.replace(/--ink:\s*#[0-9a-fA-F]+;/g, '--ink: #070707;');
html = html.replace(/--ink2:\s*#[0-9a-fA-F]+;/g, '--ink2: #121212;');
html = html.replace(/--ink3:\s*#[0-9a-fA-F]+;/g, '--ink3: #1a1a1a;');

// Update the red/magenta accents to gold to match the logo
html = html.replace(/--velvet:\s*#[0-9a-fA-F]+;/g, '--velvet: #D6B553;');
html = html.replace(/--magenta:\s*#[0-9a-fA-F]+;/g, '--magenta: #D6B553;');
html = html.replace(/--gold:\s*#[0-9a-fA-F]+;/g, '--gold: #D6B553;');

fs.writeFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', html);
console.log('Successfully updated colors');
