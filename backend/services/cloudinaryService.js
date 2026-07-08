import cloudinary from '../config/cloudinary.js';

import fs from 'fs';
import path from 'path';

/**
 * Upload image buffer to Cloudinary
 */
export const uploadToCloudinary = (fileBuffer, folder = 'nutritrack') => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === 'your_api_key') {
      const fileName = `local_${Date.now()}.jpg`;
      fs.writeFileSync(path.join(process.cwd(), 'uploads', fileName), fileBuffer);
      return resolve({ secure_url: `http://localhost:${process.env.PORT || 5000}/uploads/${fileName}` });
    }
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

/**
 * Delete image from Cloudinary by public_id
 */
export const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl) return;
  if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === 'your_api_key') return;
  
  try {
    // Extract public_id from URL
    const parts = imageUrl.split('/');
    const folderAndFile = parts.slice(-2).join('/');
    const publicId = folderAndFile.split('.')[0];
    
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error.message);
  }
};
