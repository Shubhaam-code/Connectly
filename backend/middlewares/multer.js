import multer from "multer"
import fs from "fs"
import path from "path"

// FIX: Auto-create the ./public directory if it doesn't exist.
// Previously, if ./public was missing, multer would throw internally and
// the request would fail with a 500 before even reaching the controller.
const uploadDir = "./public"
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
    console.log("📁 Created upload directory:", uploadDir)
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        // Use Date.now() prefix to avoid filename collisions when
        // multiple users upload files with the same original name simultaneously.
        const safeName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '')
        const uniqueName = `${Date.now()}-${safeName}`
        cb(null, uniqueName)
    }
})

// FIX: Added file size limit (50MB) and file type filter to prevent:
// 1. Server crash from huge uploads
// 2. Cloudinary 403 from unexpected file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ]
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: jpg, jpeg, png, webp, gif, mp4, mov, avi, webm`), false)
    }
}

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024  // 50 MB max
    }
})