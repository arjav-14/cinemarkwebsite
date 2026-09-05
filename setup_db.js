require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const createTablesQuery = `
-- Gallery Images table
CREATE TABLE IF NOT EXISTS gallery_images (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    public_id TEXT,
    title TEXT,
    section TEXT DEFAULT 'All',
    sort_order INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist in case table was created earlier
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'All';
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS public_id TEXT;
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Site Images table (hero banners, posters, photo strip, logos, branding)
CREATE TABLE IF NOT EXISTS site_images (
    id SERIAL PRIMARY KEY,
    key_name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL, -- 'hero', 'photostrip', 'posters', 'branding', 'facilities'
    title TEXT,
    image_url TEXT NOT NULL,
    public_id TEXT,
    link_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Franchise Enquiries / Contact submissions
CREATE TABLE IF NOT EXISTS enquiries (
    id SERIAL PRIMARY KEY,
    type TEXT DEFAULT 'franchise', -- 'franchise', 'brochure', 'call', 'contact', 'event'
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    city TEXT,
    state TEXT,
    business TEXT,
    property TEXT,
    message TEXT,
    status TEXT DEFAULT 'new', -- 'new', 'in_progress', 'contacted', 'closed'
    notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'franchise';
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS notes TEXT;

-- Cinema Locations table
CREATE TABLE IF NOT EXISTS cinema_locations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    address TEXT,
    screens INTEGER DEFAULT 1,
    features TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'Operational',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE cinema_locations ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE cinema_locations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE cinema_locations ADD COLUMN IF NOT EXISTS screens INTEGER DEFAULT 1;
ALTER TABLE cinema_locations ADD COLUMN IF NOT EXISTS features TEXT;
ALTER TABLE cinema_locations ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE cinema_locations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Operational';
ALTER TABLE cinema_locations ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- News Items table
CREATE TABLE IF NOT EXISTS news_items (
    id SERIAL PRIMARY KEY,
    date_label TEXT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT DEFAULT 'Announcements',
    image_url TEXT,
    link_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE news_items ADD COLUMN IF NOT EXISTS date_label TEXT;
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Announcements';
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Navbar Links table
CREATE TABLE IF NOT EXISTS navbar_links (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    href TEXT NOT NULL,
    is_more BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE navbar_links ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Site Content table for CMS text
CREATE TABLE IF NOT EXISTS site_content (
    id TEXT PRIMARY KEY,
    html_content TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

const seedData = async () => {
  // 1. Seed gallery images if empty
  const galCount = await pool.query('SELECT COUNT(*) FROM gallery_images');
  if (parseInt(galCount.rows[0].count, 10) === 0) {
    console.log('Seeding initial gallery images...');
    const gallerySeed = [
      { section: 'Exterior', url: 'https://res.cloudinary.com/mibjryxu/image/upload/v1784714661/cinemark_assets/jnggqiticwkyobjvjjf9.jpg', title: 'Signature Lounge' },
      { section: 'Lobby', url: 'https://res.cloudinary.com/mibjryxu/image/upload/v1784714662/cinemark_assets/yjhj5dfpqjq4nc7pgfkz.jpg', title: 'Classic Recliner Hall' },
      { section: 'Auditorium', url: 'https://res.cloudinary.com/mibjryxu/image/upload/v1784714663/cinemark_assets/ptk6o9taux16vfouphsr.jpg', title: 'Signature Screen — Aisle View' },
      { section: 'Food & Beverage', url: 'https://res.cloudinary.com/mibjryxu/image/upload/v1784714658/cinemark_assets/rgbyhny0qg4gumh7chx7.jpg', title: 'The Cafeteria' },
      { section: 'VIP Lounge', url: 'https://res.cloudinary.com/mibjryxu/image/upload/v1784714663/cinemark_assets/hv6kd7kapsczkeakuzyd.jpg', title: 'Premium Recliner Detail' },
      { section: 'Exterior', url: 'https://res.cloudinary.com/mibjryxu/image/upload/v1784714660/cinemark_assets/wrstiweg5dk5aqgtucd9.jpg', title: 'Downtown Snack Corner' },
      { section: 'Lobby', url: 'https://res.cloudinary.com/mibjryxu/image/upload/v1784714664/cinemark_assets/podck5nkg7u1uwnz0rkk.jpg', title: 'Cafeteria & Lounge' },
      { section: 'Auditorium', url: 'https://res.cloudinary.com/mibjryxu/image/upload/v1784714665/cinemark_assets/mipizszd2zwp4hxhnq15.jpg', title: 'Velvet Hall' },
      { section: 'Food & Beverage', url: 'https://res.cloudinary.com/mibjryxu/image/upload/v1784714666/cinemark_assets/ye9e1du6blv27kglpfqn.jpg', title: 'Spectra X Immersive Hall' },
      { section: 'VIP Lounge', url: 'https://res.cloudinary.com/mibjryxu/image/upload/v1784714667/cinemark_assets/zaden8i1pws26c0hrmvq.jpg', title: 'Spectra X — Screen View' },
      { section: 'Exterior', url: 'https://res.cloudinary.com/mibjryxu/image/upload/v1784714667/cinemark_assets/b9m8ar2x73jhodxn1bif.jpg', title: 'Smart Cinema Hall' },
      { section: 'Lobby', url: 'https://res.cloudinary.com/mibjryxu/image/upload/v1784714657/cinemark_assets/b9vy7qfsyrxrypd9odci.jpg', title: 'Luxury Waiting Lounge' },
      { section: 'Auditorium', url: 'https://res.cloudinary.com/mibjryxu/image/upload/v1784714668/cinemark_assets/vyfzpgejcqsdgwztezlm.jpg', title: 'Downtown Corridor' },
      { section: 'Food & Beverage', url: 'https://res.cloudinary.com/mibjryxu/image/upload/v1784714659/cinemark_assets/dxmuqcok1rvswyq5duui.jpg', title: 'Fresh Popcorn, Always' }
    ];
    for (const g of gallerySeed) {
      await pool.query(
        'INSERT INTO gallery_images (url, title, section) VALUES ($1, $2, $3)',
        [g.url, g.title, g.section]
      );
    }
  }

  // 2. Seed cinema locations if empty
  const locCount = await pool.query('SELECT COUNT(*) FROM cinema_locations');
  if (parseInt(locCount.rows[0].count, 10) === 0) {
    console.log('Seeding initial cinema locations...');
    const locationsSeed = [
      { name: 'Cinemark Gold Lounge', city: 'Bengaluru', state: 'Karnataka', address: 'Indiranagar 100ft Road, Bengaluru', screens: 4, features: 'Dolby Atmos, 4K RGB Laser, Plush Recliners, Gourmet F&B' },
      { name: 'Cinemark Spectra', city: 'Mumbai', state: 'Maharashtra', address: 'Bandra West, Linking Road, Mumbai', screens: 6, features: 'Spectra X 4D, IMAX Laser, VIP Lounge, Valet Parking' },
      { name: 'Cinemark Luxe', city: 'Hyderabad', state: 'Telangana', address: 'Jubilee Hills, Road No. 36, Hyderabad', screens: 5, features: 'Dolby Atmos, In-Seat Dining, Acoustic Architecture' },
      { name: 'Cinemark Premiere', city: 'Delhi NCR', state: 'Delhi', address: 'DLF Phase 5, Golf Course Road, Gurugram', screens: 6, features: '4K Projection, Private Screening Room, Downtown Cafe' },
      { name: 'Cinemark Express', city: 'Ahmedabad', state: 'Gujarat', address: 'SG Highway, Bodakdev, Ahmedabad', screens: 4, features: 'Dolby 7.1, Luxury Seating, Concession Bar' }
    ];
    for (let i = 0; i < locationsSeed.length; i++) {
      const loc = locationsSeed[i];
      await pool.query(
        'INSERT INTO cinema_locations (name, city, state, address, screens, features, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [loc.name, loc.city, loc.state, loc.address, loc.screens, loc.features, i + 1]
      );
    }
  }

  // 3. Seed news items if empty
  const newsCount = await pool.query('SELECT COUNT(*) FROM news_items');
  if (parseInt(newsCount.rows[0].count, 10) === 0) {
    console.log('Seeding initial news items...');
    const newsSeed = [
      { date_label: 'OCT 2025', title: 'Cinemark Expands to 50+ Premium Screens Across Metro Hubs', body: 'With rapid franchise growth and landmark properties in Bengaluru, Mumbai, and Hyderabad, Cinemark Group sets a new benchmark in luxury cinema.', category: 'Expansion' },
      { date_label: 'JAN 2026', title: 'Next-Gen Spectra X Laser Audio Introduced Across Flagships', body: 'Cinemark partners with premier acoustic architects to deploy proprietary spatial surround technology and ultra-high-definition RGB laser projection.', category: 'Technology' },
      { date_label: 'MAR 2026', title: 'Franchise Partner Program Surpasses ₹150 Cr in Partner Capital', body: 'Over 30 franchisee cinema partners have joined the Cinemark ecosystem, leveraging turnkey project execution and centralized ticketing.', category: 'Franchise' }
    ];
    for (let i = 0; i < newsSeed.length; i++) {
      const n = newsSeed[i];
      await pool.query(
        'INSERT INTO news_items (date_label, title, body, category, sort_order) VALUES ($1, $2, $3, $4, $5)',
        [n.date_label, n.title, n.body, n.category, i + 1]
      );
    }
  }
};

async function setup() {
  try {
    console.log('Connecting to Neon PostgreSQL and creating tables...');
    await pool.query(createTablesQuery);
    console.log('Tables verified and created successfully!');
    await seedData();
    console.log('Database schema and seed completed successfully!');
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    await pool.end();
  }
}

setup();
