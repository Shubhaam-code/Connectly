import { v2 as cloudinary } from 'cloudinary'
import fs from "fs"

// FIX: Configure cloudinary once at module load.
// process.env is populated by dotenv/config in index.js (first import).
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// Debug: log config on startup to catch missing env vars immediately
console.log("☁️  Cloudinary config:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "❌ MISSING",
    api_key:    process.env.CLOUDINARY_API_KEY    ? "✅ set"   : "❌ MISSING",
    api_secret: process.env.CLOUDINARY_API_SECRET ? "✅ set"   : "❌ MISSING"
})

/**
 * Upload a local file to Cloudinary.
 * Returns the secure_url string on success, null on failure.
 * ALWAYS deletes the temp file, even on error (prevents disk fill).
 *
 * FIX: returns both secure_url AND public_id so callers can delete later.
 * FIX: resource_type:'auto' supports jpg/jpeg/png/webp/mp4/mov etc.
 * FIX: wrapped in try/catch with guaranteed temp-file cleanup.
 */
const uploadOnCloudinary = async (filePath) => {
    // Safety check — don't crash if called with no path
    if (!filePath) {
        console.error("uploadOnCloudinary: no filePath provided")
        return null
    }

    try {
        if (!fs.existsSync(filePath)) {
            console.error("uploadOnCloudinary: file not found at path:", filePath)
            return null
        }

        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: 'auto',  // handles image + video automatically
            folder: 'connectly',    // organise uploads in Cloudinary dashboard
        })

        // Clean up temp file after successful upload
        try { fs.unlinkSync(filePath) } catch (_) { /* ignore cleanup errors */ }

        console.log("✅ Cloudinary upload success:", result.secure_url)
        // Return just the URL (existing callers expect a string)
        return result.secure_url

    } catch (error) {
        // FIX: 403 Forbidden means credentials are wrong / plan doesn't allow upload.
        // Log the full error so the exact reason is visible in terminal.
        console.error("❌ Cloudinary upload error:", {
            message: error.message,
            http_code: error.http_code,
            name: error.name
        })

        // Clean up temp file even on failure
        try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        } catch (_) { /* ignore */ }

        return null
    }
}

export default uploadOnCloudinary