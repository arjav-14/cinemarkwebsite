const fs = require('fs');
let html = fs.readFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', 'utf8');

// 1. Clean up injected mobile CSS from previous attempts to avoid conflicts
html = html.replace(/\/\* --- PRODUCTION MOBILE CSS --- \*\/[\s\S]*?<\/style>/, '</style>');
html = html.replace(/\/\* --- MOBILE FIXES --- \*\/[\s\S]*?<\/style>/, '</style>');
html = html.replace(/\/\* --- MOBILE RESPONSIVENESS --- \*\/[\s\S]*?<\/style>/, '</style>');

// 2. Inject a clean, comprehensive production-ready mobile block
const finalMobileCss = `
    /* --- PRODUCTION MOBILE CSS (FULL AUDIT) --- */
    
    /* Small Tablets & Large Phones (768px - 1024px) */
    @media(max-width: 1024px) {
      .ecosystem {
        grid-template-columns: repeat(2, 1fr) !important;
      }
      .movies {
        grid-template-columns: repeat(2, 1fr) !important;
      }
      .stats-grid {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }

    /* Mobile Phones (up to 768px) */
    @media(max-width: 768px) {
      /* 1. Global Layout & Viewport */
      body, html {
        overflow-x: hidden !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .block, .block-tight, section {
        padding: 60px 20px !important;
      }
      
      /* 2. Navbar & Header */
      .logo img {
        height: 28px !important;
      }
      
      /* 3. Hero Section */
      .hero-title, .hero h1 {
        font-size: clamp(2.2rem, 10vw, 3.5rem) !important;
        letter-spacing: -1px !important;
      }
      .hero p.sub {
        font-size: 0.95rem !important;
        margin-bottom: 30px !important;
      }
      .page-title {
        font-size: clamp(2rem, 8vw, 2.8rem) !important;
      }
      .hero-ctas {
        flex-direction: column !important;
        width: 100% !important;
      }
      .hero-ctas button, .hero-ctas a {
        width: 100% !important;
      }
      
      /* 4. Ecosystem & Cards */
      .ecosystem {
        grid-template-columns: 1fr !important;
      }
      
      /* 5. Photo Strip */
      .photo-strip .strip-item {
        width: 260px !important;
        height: 170px !important;
      }
      
      /* 6. The Cafeteria */
      .cafe-split {
        grid-template-columns: 1fr !important;
      }
      .cafe-photo {
        min-height: 260px !important;
      }
      .cafe-info {
        padding: 30px 20px !important;
      }
      
      /* 7. Luxury / Two-Column Sections */
      .luxury, .two-col {
        grid-template-columns: 1fr !important;
        gap: 30px !important;
      }
      .luxury-visual {
        height: 280px !important;
      }
      
      /* 8. Stats & Movies */
      .stats-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 1.5rem !important;
      }
      .stat-num {
        font-size: 2.2rem !important;
      }
      .movies {
        grid-template-columns: 1fr !important;
      }
      .movie-poster {
        height: 200px !important;
      }
      
      /* 9. Forms */
      .form-row {
        grid-template-columns: 1fr !important;
      }
      .aurelia-form input, .aurelia-form select, .aurelia-form textarea {
        width: 100% !important;
      }
      
      /* 10. Modals & Popups */
      .modal-box {
        padding: 24px 20px !important;
        max-width: 95% !important;
      }
      
      /* 11. News & Career Items */
      .news-item {
        grid-template-columns: 1fr !important;
        gap: 10px !important;
      }
      .job-card {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 14px !important;
      }
      
      /* 12. Footer Columns */
      .footer-grid {
        grid-template-columns: 1fr !important;
        gap: 40px !important;
        text-align: center !important;
      }
      .footer-col {
        width: 100% !important;
      }
      
      /* General Button Restyling */
      button, .btn-ghost, .btn-gold, .btn-primary {
        width: 100% !important;
        text-align: center !important;
        justify-content: center !important;
      }
    }
`;

html = html.replace('</style>', finalMobileCss + '\n  </style>');

fs.writeFileSync('c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html', html);
console.log('Final Production Mobile CSS applied!');
