require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const createTablesQuery = `
-- Create the gallery images table
CREATE TABLE IF NOT EXISTS gallery_images (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the navbar links table
CREATE TABLE IF NOT EXISTS navbar_links (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    href TEXT NOT NULL,
    is_more BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0
);

-- Create the site content table for CMS text
CREATE TABLE IF NOT EXISTS site_content (
    id TEXT PRIMARY KEY,
    html_content TEXT NOT NULL
);
`;

async function setup() {
  try {
    await pool.query(createTablesQuery);
    console.log('Tables created successfully!');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    await pool.end();
  }
}

setup();
