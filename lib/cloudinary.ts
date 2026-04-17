import { v2 as cloudinary } from 'cloudinary'

if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error('Missing CLOUDINARY_CLOUD_NAME')
if (!process.env.CLOUDINARY_API_KEY) throw new Error('Missing CLOUDINARY_API_KEY')
if (!process.env.CLOUDINARY_API_SECRET) throw new Error('Missing CLOUDINARY_API_SECRET')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export { cloudinary }
