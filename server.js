require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const multer = require('multer');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;

const app = express();

// --- Configuration & Secrets ---
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cinemark_super_secure_jwt_secret_key_2026_production';
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cinemark@123';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'Cinemarkgroup@gmail.com').toLowerCase().trim();

// --- Database Configuration (Neon Postgres) ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Connected to Neon PostgreSQL successfully at:', res.rows[0].now);
  }
});

// --- Cloudinary Configuration ---
// Automatically loads CLOUDINARY_URL from process.env if present
if (process.env.CLOUDINARY_URL) {
  cloudinary.config();
  console.log('✅ Cloudinary configured successfully.');
}

// Multer in-memory storage for Cloudinary upload stream
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// --- Security & Middleware ---
app.use(helmet({
  contentSecurityPolicy: false, // Allows CDN scripts, Google Fonts, and Cloudinary media
  crossOriginEmbedderPolicy: false
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', generalLimiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
});

const enquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'Enquiry rate limit exceeded. Please try again later.' }
});

// Serve static assets
app.use(express.static(path.join(__dirname, './')));

// --- Helper Functions ---
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Admin Authentication Middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers['x-admin-token']) {
    token = req.headers['x-admin-token'];
  } else if (req.headers['x-admin-password']) {
    // Backward compatibility for legacy requests
    if (req.headers['x-admin-password'] === ADMIN_PASSWORD) {
      req.admin = { email: ADMIN_EMAIL, role: 'admin' };
      return next();
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

// Upload buffer directly to Cloudinary
function uploadToCloudinary(buffer, folder = 'cinemark_assets') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        quality: 'auto:good',
        fetch_format: 'auto'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

// ==========================================
// 1. PAGE ROUTES
// ==========================================

// Public Main Website (Zero login required for visitors)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Cinemark.html'));
});

// Dedicated Admin Portal
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ==========================================
// 2. AUTHENTICATION (ADMIN ONLY)
// ==========================================

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

app.post('/api/login', loginLimiter, (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const email = value.email.toLowerCase().trim();
  const password = value.password;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = generateToken({ email: ADMIN_EMAIL, role: 'admin' });
    return res.json({
      success: true,
      token,
      admin: {
        email: ADMIN_EMAIL,
        role: 'admin'
      }
    });
  }

  return res.status(401).json({ error: 'Invalid admin email or password.' });
});

app.get('/api/auth/verify', requireAdmin, (req, res) => {
  res.json({ valid: true, admin: req.admin });
});

app.post('/api/admin/settings/password', requireAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }
  if (currentPassword !== ADMIN_PASSWORD) {
    return res.status(400).json({ error: 'Current password does not match.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  ADMIN_PASSWORD = newPassword;
  return res.json({ success: true, message: 'Admin password updated successfully for this session.' });
});

// ==========================================
// 3. DASHBOARD STATS (ADMIN)
// ==========================================

app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [galleryRes, locRes, newsRes, enquiryRes, pendingEnquiryRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM gallery_images'),
      pool.query('SELECT COUNT(*) FROM cinema_locations'),
      pool.query('SELECT COUNT(*) FROM news_items'),
      pool.query('SELECT COUNT(*) FROM enquiries'),
      pool.query("SELECT COUNT(*) FROM enquiries WHERE status = 'new'")
    ]);

    res.json({
      galleryCount: parseInt(galleryRes.rows[0].count, 10),
      locationsCount: parseInt(locRes.rows[0].count, 10),
      newsCount: parseInt(newsRes.rows[0].count, 10),
      totalEnquiries: parseInt(enquiryRes.rows[0].count, 10),
      newEnquiries: parseInt(pendingEnquiryRes.rows[0].count, 10)
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Failed to load stats.' });
  }
});

// ==========================================
// 4. GALLERY API (PUBLIC GET, ADMIN MUTATE)
// ==========================================

// Public list of gallery photos
app.get('/api/gallery', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, url, title, section, sort_order, uploaded_at FROM gallery_images ORDER BY sort_order ASC, uploaded_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching gallery:', err);
    res.status(500).json({ error: 'Database error fetching gallery.' });
  }
});

// Admin upload single or multiple photos
app.post('/api/gallery', requireAdmin, upload.array('images', 10), async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (files.length === 0) {
    return res.status(400).json({ error: 'No image files provided.' });
  }

  const { title = '', section = 'All', sort_order = 0 } = req.body;
  const uploadedRecords = [];

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const cloudResult = await uploadToCloudinary(file.buffer, 'cinemark_gallery');
      const itemTitle = files.length > 1 ? `${title} (${i + 1})`.trim() : title;

      const dbRes = await pool.query(
        'INSERT INTO gallery_images (url, public_id, title, section, sort_order, uploaded_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
        [cloudResult.secure_url, cloudResult.public_id, itemTitle, section, parseInt(sort_order, 10) + i]
      );
      uploadedRecords.push(dbRes.rows[0]);
    }
    res.json({ success: true, count: uploadedRecords.length, images: uploadedRecords });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: 'Cloud upload or database insert failed.' });
  }
});

// Admin update gallery photo metadata
app.put('/api/gallery/:id', requireAdmin, async (req, res) => {
  const { title, section, sort_order } = req.body;
  try {
    const result = await pool.query(
      'UPDATE gallery_images SET title = COALESCE($1, title), section = COALESCE($2, section), sort_order = COALESCE($3, sort_order) WHERE id = $4 RETURNING *',
      [title, section, sort_order !== undefined ? parseInt(sort_order, 10) : null, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Photo not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating photo:', err);
    res.status(500).json({ error: 'Failed to update photo.' });
  }
});

// Admin delete gallery photo
app.delete('/api/gallery/:id', requireAdmin, async (req, res) => {
  try {
    const findRes = await pool.query('SELECT public_id FROM gallery_images WHERE id = $1', [req.params.id]);
    if (findRes.rowCount > 0 && findRes.rows[0].public_id) {
      try {
        await cloudinary.uploader.destroy(findRes.rows[0].public_id);
      } catch (cErr) {
        console.warn('Cloudinary image deletion failed (may already be deleted):', cErr.message);
      }
    }
    await pool.query('DELETE FROM gallery_images WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Photo deleted successfully.' });
  } catch (err) {
    console.error('Error deleting photo:', err);
    res.status(500).json({ error: 'Database delete failed.' });
  }
});

// ==========================================
// 5. SITE IMAGES & ASSETS (HERO, PHOTO STRIP, BRANDING)
// ==========================================

// Public list of site images (optionally filtered by category)
app.get('/api/site-images', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM site_images WHERE is_active = TRUE';
    const params = [];
    if (category) {
      query += ' AND category = $1';
      params.push(category);
    }
    query += ' ORDER BY sort_order ASC, updated_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching site images:', err);
    res.status(500).json({ error: 'Failed to fetch site images.' });
  }
});

// Admin list all site images (including inactive)
app.get('/api/admin/site-images', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM site_images ORDER BY category ASC, sort_order ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching all site images:', err);
    res.status(500).json({ error: 'Failed to fetch site images.' });
  }
});

// Admin upload/create new site asset
app.post('/api/admin/site-images', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { key_name, category = 'general', title = '', link_url = '', sort_order = 0 } = req.body;
    let imageUrl = req.body.image_url;
    let publicId = null;

    if (req.file) {
      const cloudResult = await uploadToCloudinary(req.file.buffer, 'cinemark_site_assets');
      imageUrl = cloudResult.secure_url;
      publicId = cloudResult.public_id;
    }

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image file or image_url is required.' });
    }

    const uniqueKey = key_name || `${category}_${Date.now()}`;

    const result = await pool.query(
      `INSERT INTO site_images (key_name, category, title, image_url, public_id, link_url, sort_order, is_active, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW())
       ON CONFLICT (key_name) DO UPDATE SET
         image_url = EXCLUDED.image_url,
         public_id = COALESCE(EXCLUDED.public_id, site_images.public_id),
         title = EXCLUDED.title,
         category = EXCLUDED.category,
         link_url = EXCLUDED.link_url,
         sort_order = EXCLUDED.sort_order,
         updated_at = NOW()
       RETURNING *`,
      [uniqueKey, category, title, imageUrl, publicId, link_url, parseInt(sort_order, 10)]
    );

    res.json({ success: true, image: result.rows[0] });
  } catch (err) {
    console.error('Error saving site image:', err);
    res.status(500).json({ error: 'Failed to save site asset.' });
  }
});

// Admin delete site image
app.delete('/api/admin/site-images/:id', requireAdmin, async (req, res) => {
  try {
    const findRes = await pool.query('SELECT public_id FROM site_images WHERE id = $1', [req.params.id]);
    if (findRes.rowCount > 0 && findRes.rows[0].public_id) {
      try {
        await cloudinary.uploader.destroy(findRes.rows[0].public_id);
      } catch (cErr) {
        console.warn('Cloudinary delete warning:', cErr.message);
      }
    }
    await pool.query('DELETE FROM site_images WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting site image:', err);
    res.status(500).json({ error: 'Failed to delete site image.' });
  }
});

// ==========================================
// 6. ENQUIRIES / FRANCHISE LEADS (PUBLIC SUBMIT, ADMIN MANAGE)
// ==========================================

const enquirySchema = Joi.object({
  type: Joi.string().default('franchise'),
  name: Joi.string().max(150).required(),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().max(50).allow('', null),
  city: Joi.string().max(100).allow('', null),
  state: Joi.string().max(100).allow('', null),
  business: Joi.string().max(200).allow('', null),
  property: Joi.string().max(200).allow('', null),
  message: Joi.string().max(2000).allow('', null)
});

// Public submission — NO LOGIN REQUIRED
app.post('/api/enquiries', enquiryLimiter, async (req, res) => {
  const { error, value } = enquirySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const result = await pool.query(
      `INSERT INTO enquiries (type, name, email, phone, city, state, business, property, message, status, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new', NOW())
       RETURNING *`,
      [
        value.type || 'franchise',
        value.name,
        value.email || '',
        value.phone || '',
        value.city || '',
        value.state || '',
        value.business || '',
        value.property || '',
        value.message || ''
      ]
    );

    res.json({
      success: true,
      message: 'Thank you! Your enquiry has been received by the Cinemark team.',
      id: result.rows[0].id
    });
  } catch (err) {
    console.error('Error saving enquiry:', err);
    res.status(500).json({ error: 'Failed to submit enquiry. Please try again.' });
  }
});

// Admin list enquiries
app.get('/api/enquiries', requireAdmin, async (req, res) => {
  try {
    const { status, type } = req.query;
    let query = 'SELECT * FROM enquiries';
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (type && type !== 'all') {
      params.push(type);
      conditions.push(`type = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY submitted_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error loading enquiries:', err);
    res.status(500).json({ error: 'Failed to load enquiries.' });
  }
});

// Admin update enquiry status & notes
app.put('/api/enquiries/:id', requireAdmin, async (req, res) => {
  const { status, notes } = req.body;
  try {
    const result = await pool.query(
      'UPDATE enquiries SET status = COALESCE($1, status), notes = COALESCE($2, notes) WHERE id = $3 RETURNING *',
      [status, notes, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Enquiry not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating enquiry:', err);
    res.status(500).json({ error: 'Failed to update enquiry.' });
  }
});

// Admin delete enquiry
app.delete('/api/enquiries/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM enquiries WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting enquiry:', err);
    res.status(500).json({ error: 'Failed to delete enquiry.' });
  }
});

// ==========================================
// 7. CINEMA LOCATIONS API (PUBLIC GET, ADMIN MUTATE)
// ==========================================

// Public list of cinema locations
app.get('/api/locations', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM cinema_locations ORDER BY sort_order ASC, created_at ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({ error: 'Failed to fetch cinema locations.' });
  }
});

// Admin add new cinema location
app.post('/api/locations', requireAdmin, async (req, res) => {
  const { name, city, state, address, screens = 1, features = '', status = 'Operational', sort_order = 0 } = req.body;
  if (!name || !city) {
    return res.status(400).json({ error: 'Name and city are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO cinema_locations (name, city, state, address, screens, features, status, sort_order, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [name, city, state || '', address || '', parseInt(screens, 10) || 1, features, status, parseInt(sort_order, 10) || 0]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error adding cinema location:', err);
    res.status(500).json({ error: 'Failed to add location.' });
  }
});

// Admin update cinema location
app.put('/api/locations/:id', requireAdmin, async (req, res) => {
  const { name, city, state, address, screens, features, status, sort_order } = req.body;
  try {
    const result = await pool.query(
      `UPDATE cinema_locations SET
         name = COALESCE($1, name),
         city = COALESCE($2, city),
         state = COALESCE($3, state),
         address = COALESCE($4, address),
         screens = COALESCE($5, screens),
         features = COALESCE($6, features),
         status = COALESCE($7, status),
         sort_order = COALESCE($8, sort_order)
       WHERE id = $9 RETURNING *`,
      [
        name,
        city,
        state,
        address,
        screens !== undefined ? parseInt(screens, 10) : null,
        features,
        status,
        sort_order !== undefined ? parseInt(sort_order, 10) : null,
        req.params.id
      ]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Location not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating location:', err);
    res.status(500).json({ error: 'Failed to update location.' });
  }
});

// Admin delete cinema location
app.delete('/api/locations/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM cinema_locations WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting location:', err);
    res.status(500).json({ error: 'Failed to delete location.' });
  }
});

// ==========================================
// 8. NEWS ITEMS API (PUBLIC GET, ADMIN MUTATE)
// ==========================================

// Public list of news items
app.get('/api/news', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM news_items ORDER BY sort_order ASC, created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching news:', err);
    res.status(500).json({ error: 'Failed to load news.' });
  }
});

// Admin add news item
app.post('/api/news', requireAdmin, async (req, res) => {
  const { date_label, title, body, category = 'Announcements', sort_order = 0 } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO news_items (date_label, title, body, category, sort_order, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [date_label || new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }).toUpperCase(), title, body, category, parseInt(sort_order, 10) || 0]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error adding news item:', err);
    res.status(500).json({ error: 'Failed to add news item.' });
  }
});

// Admin update news item
app.put('/api/news/:id', requireAdmin, async (req, res) => {
  const { date_label, title, body, category, sort_order } = req.body;
  try {
    const result = await pool.query(
      `UPDATE news_items SET
         date_label = COALESCE($1, date_label),
         title = COALESCE($2, title),
         body = COALESCE($3, body),
         category = COALESCE($4, category),
         sort_order = COALESCE($5, sort_order)
       WHERE id = $6 RETURNING *`,
      [date_label, title, body, category, sort_order !== undefined ? parseInt(sort_order, 10) : null, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'News item not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating news item:', err);
    res.status(500).json({ error: 'Failed to update news item.' });
  }
});

// Admin delete news item
app.delete('/api/news/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM news_items WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting news item:', err);
    res.status(500).json({ error: 'Failed to delete news item.' });
  }
});

// ==========================================
// 9. NAVBAR API (PUBLIC GET, ADMIN MUTATE)
// ==========================================

app.get('/api/navbar', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM navbar_links ORDER BY sort_order ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching navbar:', err);
    res.status(500).json({ error: 'Database error.' });
  }
});

app.post('/api/navbar', requireAdmin, async (req, res) => {
  const { title, href, isMore, sortOrder } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO navbar_links (title, href, is_more, sort_order, updated_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [title, href, Boolean(isMore), parseInt(sortOrder, 10) || 0]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error adding nav link:', err);
    res.status(500).json({ error: 'Failed to insert navbar link.' });
  }
});

app.delete('/api/navbar/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM navbar_links WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting nav link:', err);
    res.status(500).json({ error: 'Failed to delete navbar link.' });
  }
});

// ==========================================
// 10. SITE CONTENT CMS (PUBLIC GET, ADMIN UPSERT)
// ==========================================

app.get('/api/content', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM site_content');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching site content:', err);
    res.status(500).json({ error: 'Database error fetching content.' });
  }
});

app.post('/api/content', requireAdmin, async (req, res) => {
  const { id, html_content } = req.body;
  if (!id || html_content === undefined) {
    return res.status(400).json({ error: 'id and html_content are required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO site_content (id, html_content, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (id) DO UPDATE SET html_content = EXCLUDED.html_content, updated_at = NOW()
       RETURNING *`,
      [id, html_content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating site content:', err);
    res.status(500).json({ error: 'Database update failed.' });
  }
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message || err);
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400 && 'body' in err)) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🎬 Cinemark Production Server running at http://localhost:${PORT}`);
  console.log(`🔐 Admin Panel available at http://localhost:${PORT}/admin`);
});
