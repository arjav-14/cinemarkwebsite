const fs = require('fs');
let html = fs.readFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', 'utf8');

// Revert just the curtain gradient back to the original velvet red colors
html = html.replace(
  'background: repeating-linear-gradient(90deg, #b89531 0px, #94751f 40px, #665011 80px, #94751f 120px, #b89531 160px);',
  'background: repeating-linear-gradient(90deg, #7a1128 0px, #8f1730 40px, #6a0f22 80px, #8f1730 120px, #7a1128 160px);'
);

fs.writeFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', html);
console.log('Restored the red curtain color!');
