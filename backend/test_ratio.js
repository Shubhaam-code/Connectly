import { mergeFeeds } from "./controllers/explore.controllers.js";

// Generate dummy items
const videos = Array.from({ length: 30 }).map((_, i) => ({ id: `video-${i}`, type: "video", source: "pexels" }));
const pexelsPhotos = Array.from({ length: 30 }).map((_, i) => ({ id: `pex-photo-${i}`, type: "photo", source: "pexels" }));
const unsplashPhotos = Array.from({ length: 30 }).map((_, i) => ({ id: `un-photo-${i}`, type: "photo", source: "unsplash" }));

const blended = mergeFeeds(videos, pexelsPhotos, unsplashPhotos, 24);

console.log("=== Testing Explore Blend Ratios ===");
console.log("Blended length:", blended.length);

const videosCount = blended.filter(item => item.type === "video").length;
const pexelsPhotosCount = blended.filter(item => item.type === "photo" && item.source === "pexels").length;
const unsplashPhotosCount = blended.filter(item => item.type === "photo" && item.source === "unsplash").length;

console.log(`Pexels Videos: ${videosCount} (${(videosCount/blended.length * 100).toFixed(1)}%)`);
console.log(`Pexels Photos: ${pexelsPhotosCount} (${(pexelsPhotosCount/blended.length * 100).toFixed(1)}%)`);
console.log(`Unsplash Photos: ${unsplashPhotosCount} (${(unsplashPhotosCount/blended.length * 100).toFixed(1)}%)`);

const isCorrect = (videosCount === 12) && (pexelsPhotosCount === 6) && (unsplashPhotosCount === 6);
console.log("Validation: " + (isCorrect ? "PASS (50% / 25% / 25%)" : "FAIL"));
if (!isCorrect) {
    process.exit(1);
}
