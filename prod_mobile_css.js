const fs = require('fs');
let html = fs.readFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', 'utf8');

// 1. Clean up injected mobile CSS from previous attempts to avoid conflicts
html = html.replace(/\/\* --- MOBILE RESPONSIVENESS --- \*\/[\s\S]*?<\/style>/, '</style>');
html = html.replace(/\/\* --- MOBILE FIXES --- \*\/[\s\S]*?<\/style>/, '</style>');

// 2. Inject a clean, comprehensive production-ready mobile block
const prodMobileCss = `
    /* --- PRODUCTION MOBILE CSS --- */
    @media(max-width: 768px) {
      body, html {
        overflow-x: hidden !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .hero-title {
        font-size: 3.2rem !important;
        letter-spacing: -1px !important;
      }
      
      .page-title {
        font-size: 2.2rem !important;
      }
      
      .block, .block-tight {
        padding: 40px 20px !important;
      }
      
      /* Force all grids to single column on mobile */
      .luxury, .two-col, .form-row, .footer-grid, .stats-grid, .gallery-grid {
        display: flex !important;
        flex-direction: column !important;
        gap: 30px !important;
        width: 100% !important;
      }
      
      /* Fix image wrappers that might shrink */
      .luxury-visual {
        width: 100% !important;
        height: 300px !important;
      }
      
      .footer-col {
        text-align: center;
        width: 100% !important;
      }
      
      nav .nav-links {
        width: 100%;
      }
      
      button, .btn-ghost, .btn-gold {
        width: 100% !important;
        text-align: center !important;
        justify-content: center !important;
      }
    }
`;

html = html.replace('</style>', prodMobileCss + '\n  </style>');

fs.writeFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', html);
console.log('Production Mobile CSS applied!');
