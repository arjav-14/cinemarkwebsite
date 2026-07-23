const fs = require('fs');

let html = fs.readFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', 'utf8');

// 1. Remove text next to logos since the vertical logo includes text
html = html.replace(/<div class="logo" onclick="go\('home'\)">([\s\S]*?)<\/div>/, `<div class="logo" onclick="go('home')"><img
        src="https://res.cloudinary.com/mibjryxu/image/upload/v1784833491/cinemark_assets/media__1784833326110.png"
        alt="Cinemark Movies logo" style="height: 54px; margin-top: 4px;"></div>`);

html = html.replace(/<div class="reveal-tag" id="revealTag">([\s\S]*?)<\/div>/, `<div class="reveal-tag" id="revealTag"><img
        src="https://res.cloudinary.com/mibjryxu/image/upload/v1784833491/cinemark_assets/media__1784833326110.png"
        alt="Cinemark Movies logo" style="max-height: 40vh; margin-bottom: 20px;"><span>presents</span></div>`);

// 2. Add @media (max-width: 600px) block right before </style>
const mobileCss = `
    /* --- MOBILE RESPONSIVENESS --- */
    @media(max-width: 600px) {
      .hero-title {
        font-size: 3.5rem !important;
        letter-spacing: -2px !important;
      }
      .page-title {
        font-size: 2.5rem !important;
      }
      .block, .block-tight {
        padding-top: 50px !important;
        padding-bottom: 50px !important;
      }
      .footer-grid, .stats-grid, .gallery-grid {
        grid-template-columns: 1fr !important;
        gap: 30px !important;
      }
      .footer-col {
        text-align: center;
      }
      nav .nav-links {
        width: 100%;
      }
      .form-row, .two-col {
        grid-template-columns: 1fr !important;
      }
      button {
        width: 100%;
        text-align: center;
        justify-content: center;
      }
      .logo img {
        height: 48px !important;
      }
    }
`;

if (!html.includes('/* --- MOBILE RESPONSIVENESS --- */')) {
  html = html.replace('</style>', mobileCss + '\n  </style>');
}

fs.writeFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', html);
console.log('Successfully updated HTML');
