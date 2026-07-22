require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());
// Serve the current directory as static files so Cinemark.html can be loaded
app.use(express.static('./'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/Cinemark.html');
});
// --- Database Configuration (Neon Postgres) ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- Cloudinary Configuration ---
// It will automatically use the CLOUDINARY_URL environment variable if set

// Multer setup for memory storage (for uploading directly to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Admin Authentication ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cinemark123';
const ADMIN_EMAIL = 'Cinemarkgroup@gmail.com'; // Added exact email requirement

// Simple middleware to check if request has admin password
function requireAdmin(req, res, next) {
  const password = req.headers['x-admin-password'];
  if (password === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

app.post('/api/login', (req, res) => {
  console.log("Login attempt received:", req.body); // Let's see if requests are reaching the server
  const { email, password } = req.body;
  
  // Checking both email and password now!
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    console.log("Login successful");
    res.json({ success: true, token: ADMIN_PASSWORD });
  } else {
    console.log("Login failed: Invalid credentials");
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

// --- Gallery API ---
app.get('/api/gallery', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gallery_images ORDER BY uploaded_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/gallery', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });

  // Upload to Cloudinary using a buffer stream
  cloudinary.uploader.upload_stream({ resource_type: 'image' }, async (error, result) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Cloudinary upload failed' });
    }

    // Save to Database
    try {
      const dbResult = await pool.query(
        'INSERT INTO gallery_images (url, title, section, uploaded_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
        [result.secure_url, req.body.title || '', req.body.section || 'All']
      );
      res.json(dbResult.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database insert failed' });
    }
  }).end(req.file.buffer);
});

app.delete('/api/gallery/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM gallery_images WHERE id = $1', [req.params.id]);
    // Optionally delete from Cloudinary here (would need to extract public_id from URL)
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database delete failed' });
  }
});

// --- Navbar API ---
app.get('/api/navbar', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM navbar_links ORDER BY sort_order ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/navbar', requireAdmin, async (req, res) => {
  const { title, href, isMore, sortOrder } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO navbar_links (title, href, is_more, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, href, isMore, sortOrder]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database insert failed' });
  }
});

app.delete('/api/navbar/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM navbar_links WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database delete failed' });
  }
});

// --- Site Content API ---
app.get('/api/content', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM site_content');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/content', requireAdmin, async (req, res) => {
  const { id, html_content } = req.body;
  try {
    // Upsert logic
    const result = await pool.query(
      `INSERT INTO site_content (id, html_content) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET html_content = EXCLUDED.html_content RETURNING *`,
      [id, html_content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database update failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
