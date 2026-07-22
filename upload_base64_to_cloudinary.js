const fs = require('fs');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: 'mibjryxu',
  api_key: '492564572855939',
  api_secret: 'TwW7Ech9J2awtfd7M7FnVCVkOow'
});

const htmlPath = 'c:/Users/arjav/OneDrive/Desktop/cinemark/Cinemark.html';

async function run() {
  let content = fs.readFileSync(htmlPath, 'utf-8');
  
  const regex = /data:image\/[^;]+;base64,[a-zA-Z0-9+/=]+/g;
  const matches = content.match(regex) || [];
  const uniqueMatches = [...new Set(matches)];
  
  console.log(`Found ${uniqueMatches.length} unique base64 images to upload.`);
  
  let i = 1;
  for (const base64Str of uniqueMatches) {
    console.log(`Uploading image ${i}/${uniqueMatches.length}...`);
    try {
      const result = await cloudinary.uploader.upload(base64Str, {
        folder: 'cinemark_assets'
      });
      console.log(`Uploaded! URL: ${result.secure_url}`);
      content = content.split(base64Str).join(result.secure_url);
    } catch (err) {
      console.error(`Failed to upload image ${i}`, err);
    }
    i++;
  }
  
  fs.writeFileSync(htmlPath, content, 'utf-8');
  console.log('Successfully updated Cinemark.html with Cloudinary URLs.');
}

run();
