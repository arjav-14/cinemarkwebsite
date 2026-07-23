const fs = require('fs');

let html = fs.readFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', 'utf8');

const additionalCss = `
    /* --- MOBILE FIXES --- */
    @media(max-width: 768px) {
      body {
        overflow-x: hidden !important;
        width: 100% !important;
      }
      .luxury, .two-col {
        grid-template-columns: 1fr !important;
        gap: 40px !important;
      }
      .luxury-visual {
        height: 300px !important;
      }
      .block, .block-tight {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
    }
`;

if (!html.includes('/* --- MOBILE FIXES --- */')) {
  html = html.replace('</style>', additionalCss + '\n  </style>');
  fs.writeFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', html);
  console.log('Mobile overflow and luxury grid fixes applied!');
} else {
  console.log('Fixes already applied.');
}
