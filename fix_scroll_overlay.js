const fs = require('fs');
let html = fs.readFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', 'utf8');

const target = `
      const heroContent = document.querySelector('.hero-content');
      const rotateBadge = document.querySelector('.rotate-badge');

      if (heroContent) {
        heroContent.style.opacity = textOpacity;
        heroContent.style.pointerEvents = textOpacity <= 0 ? 'none' : 'auto';
      }
      if (rotateBadge) {
        rotateBadge.style.opacity = textOpacity;
        rotateBadge.style.pointerEvents = textOpacity <= 0 ? 'none' : 'auto';
      }
`;

const replacement = `
      const heroContent = document.querySelector('.hero-content');
      const rotateBadge = document.querySelector('.rotate-badge');
      const heroOverlay = document.querySelector('.hero-overlay');

      if (heroContent) {
        heroContent.style.opacity = textOpacity;
        heroContent.style.pointerEvents = textOpacity <= 0 ? 'none' : 'auto';
      }
      if (rotateBadge) {
        rotateBadge.style.opacity = textOpacity;
        rotateBadge.style.pointerEvents = textOpacity <= 0 ? 'none' : 'auto';
      }
      if (heroOverlay) {
        heroOverlay.style.opacity = textOpacity;
        heroOverlay.style.pointerEvents = textOpacity <= 0 ? 'none' : 'auto';
      }
`;

if (html.includes("const heroOverlay = document.querySelector('.hero-overlay');")) {
    console.log("Already updated.");
} else {
    html = html.replace(target, replacement);
    fs.writeFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', html);
    console.log("Hero overlay fade out logic applied!");
}
