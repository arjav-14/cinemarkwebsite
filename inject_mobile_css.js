const fs = require('fs');

let html = fs.readFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', 'utf8');

const mobileCss = `
    /* --- MOBILE RESPONSIVENESS --- */
    @media(max-width: 768px) {
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
      button, .btn-ghost, .btn-gold {
        width: 100%;
        text-align: center;
        justify-content: center;
      }
    }
`;

if (!html.includes('/* --- MOBILE RESPONSIVENESS --- */')) {
  html = html.replace('</style>', mobileCss + '\n  </style>');
  fs.writeFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', html);
  console.log('Mobile CSS injected successfully!');
} else {
  console.log('Mobile CSS already present.');
}
