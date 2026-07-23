const fs = require('fs');

let html = fs.readFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', 'utf8');

// Replace hardcoded RGB colors in radial-gradients with Gold (214, 181, 83)
html = html.replace(/rgba\(224,\s*68,\s*123,/g, 'rgba(214, 181, 83,'); // Old magenta
html = html.replace(/rgba\(179,\s*30,\s*61,/g, 'rgba(214, 181, 83,'); // Old velvet red
html = html.replace(/rgba\(201,\s*162,\s*39,/g, 'rgba(214, 181, 83,'); // Old mismatching gold

fs.writeFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', html);
console.log('Successfully updated background gradients to gold!');
