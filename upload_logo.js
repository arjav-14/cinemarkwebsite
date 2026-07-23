require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL
});

async function uploadLogo() {
  const filePath = 'C:/Users/arjav/.gemini/antigravity-ide/brain/e95ee73a-420e-42de-bdd3-01f6f5704724/media__1784833326110.png';
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'cinemark_assets',
      use_filename: true,
      unique_filename: false,
    });
    console.log('Logo uploaded successfully!');
    console.log('Secure URL:', result.secure_url);
  } catch (err) {
    console.error('Error uploading logo:', err);
  }
}

uploadLogo();
