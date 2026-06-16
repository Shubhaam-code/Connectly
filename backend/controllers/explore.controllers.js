import 'dotenv/config'
import redis from "../config/redis.js"

const PEXELS_API_KEY = process.env.PEXELS_API_KEY
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY

// In-memory cache fallback
const inMemoryCache = new Map()
const CACHE_TTL = 300 // 5 minutes cache

const getCached = async (key) => {
    if (redis && !redis.isStub) {
        try {
            const data = await redis.get(key)
            if (data) return JSON.parse(data)
        } catch (err) {
            console.error("Redis get error in explore cache:", err.message)
        }
    }
    const mem = inMemoryCache.get(key)
    if (mem && mem.expiry > Date.now()) {
        return mem.data
    }
    return null
}

const setCached = async (key, data) => {
    if (redis && !redis.isStub) {
        try {
            await redis.setex(key, CACHE_TTL, JSON.stringify(data))
            return
        } catch (err) {
            console.error("Redis set error in explore cache:", err.message)
        }
    }
    inMemoryCache.set(key, {
        data,
        expiry: Date.now() + CACHE_TTL * 1000
    })
}

// ── MOCK DATASET FOR FALLBACKS ────────────────────────────────────────────────
const MOCK_ITEMS = [
    // Videos (Pexels)
    {
        id: "mock-video-1",
        type: "video",
        source: "pexels",
        title: "Beautiful cinematic sunset over ocean waves",
        image: "https://images.pexels.com/photos/847393/pexels-photo-847393.jpeg?auto=compress&cs=tinysrgb&w=800",
        video: "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c0227e338c35d9a202d08a502be35cfb&profile_id=165&oauth2_token_id=57447761",
        author: "Francesco Ungaro",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        trendingScore: 950,
        width: 1920,
        height: 1080,
        duration: 15,
        tags: ["sunset", "ocean", "nature", "travel", "cute"]
    },
    {
        id: "mock-video-2",
        type: "video",
        source: "pexels",
        title: "Coding on a mechanical keyboard with neon lighting",
        image: "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=800",
        video: "https://player.vimeo.com/external/538568257.sd.mp4?s=ec5bc9c2d1b7d5eb87693998b48bb1ec650d53c7&profile_id=165&oauth2_token_id=57447761",
        author: "Designecologist",
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        trendingScore: 1200,
        width: 1080,
        height: 1920,
        duration: 20,
        tags: ["coding", "keyboard", "technology", "neon"]
    },
    {
        id: "mock-video-3",
        type: "video",
        source: "pexels",
        title: "Tokyo neon lights night walk time-lapse",
        image: "https://images.pexels.com/photos/2187313/pexels-photo-2187313.jpeg?auto=compress&cs=tinysrgb&w=800",
        video: "https://player.vimeo.com/external/435674703.sd.mp4?s=6f4af4f6d1b80e461a29f8f26db7e01e654e7d43&profile_id=165&oauth2_token_id=57447761",
        author: "Alexey Demidov",
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        trendingScore: 880,
        width: 1920,
        height: 1080,
        duration: 25,
        tags: ["tokyo", "travel", "city", "neon"]
    },
    {
        id: "mock-video-4",
        type: "video",
        source: "pexels",
        title: "Dolly zoom forest road foggy drone capture",
        image: "https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=800",
        video: "https://player.vimeo.com/external/454516756.sd.mp4?s=54c9fa308be7e57c664b3ef86eb8c7a6e768e967&profile_id=165&oauth2_token_id=57447761",
        author: "Ruud",
        createdAt: new Date(Date.now() - 14400000).toISOString(),
        trendingScore: 790,
        width: 1920,
        height: 1080,
        duration: 18,
        tags: ["drone", "forest", "nature", "travel"]
    },
    {
        id: "mock-video-5",
        type: "video",
        source: "pexels",
        title: "Stunning starry sky and milky way time-lapse",
        image: "https://images.pexels.com/photos/2469122/pexels-photo-2469122.jpeg?auto=compress&cs=tinysrgb&w=800",
        video: "https://player.vimeo.com/external/481977797.sd.mp4?s=2dfad1cbe4a30e8c7cdcf3e387c9751cf8d13264&profile_id=165&oauth2_token_id=57447761",
        author: "Felix Mittermeier",
        createdAt: new Date(Date.now() - 18000000).toISOString(),
        trendingScore: 920,
        width: 1080,
        height: 1920,
        duration: 12,
        tags: ["stars", "nature", "space", "milky way"]
    },
    {
        id: "mock-video-6",
        type: "video",
        source: "pexels",
        title: "Abstract rotating cyber circuit board interface",
        image: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800",
        video: "https://player.vimeo.com/external/409156683.sd.mp4?s=4a3b680789885871ef3b6d7ea84346985a6a6296&profile_id=165&oauth2_token_id=57447761",
        author: "Pressmaster",
        createdAt: new Date(Date.now() - 21600000).toISOString(),
        trendingScore: 1100,
        width: 1920,
        height: 1080,
        duration: 14,
        tags: ["circuit", "technology", "abstract", "digital"]
    },
    {
        id: "mock-video-7",
        type: "video",
        source: "pexels",
        title: "Cute cat playing with thread on a bed",
        image: "https://images.pexels.com/photos/1048270/pexels-photo-1048270.jpeg?auto=compress&cs=tinysrgb&w=800",
        video: "https://player.vimeo.com/external/384752834.sd.mp4?s=e523fbf502b489d81d2df522d08a502be35cfb&profile_id=165&oauth2_token_id=57447761",
        author: "Kamil Kotarba",
        createdAt: new Date(Date.now() - 25200000).toISOString(),
        trendingScore: 990,
        width: 1080,
        height: 1080,
        duration: 10,
        tags: ["cat", "cute", "pet", "funny"]
    },
    {
        id: "mock-video-8",
        type: "video",
        source: "pexels",
        title: "Dazzling northern lights aurora borealis time-lapse",
        image: "https://images.pexels.com/photos/1906658/pexels-photo-1906658.jpeg?auto=compress&cs=tinysrgb&w=800",
        video: "https://player.vimeo.com/external/481977797.sd.mp4?s=2dfad1cbe4a30e8c7cdcf3e387c9751cf8d13264&profile_id=165&oauth2_token_id=57447761",
        author: "Vincent R.",
        createdAt: new Date(Date.now() - 30000000).toISOString(),
        trendingScore: 870,
        width: 1920,
        height: 1080,
        duration: 16,
        tags: ["aurora", "travel", "nature", "stars"]
    },

    // Unsplash Photos
    {
        id: "mock-photo-unsplash-1",
        type: "photo",
        source: "unsplash",
        title: "Scenic turquoise sea and tropical beach side",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        author: "Sean Oulashin",
        createdAt: new Date(Date.now() - 4000000).toISOString(),
        trendingScore: 780,
        width: 800,
        height: 1200,
        tags: ["travel", "beach", "ocean", "nature"]
    },
    {
        id: "mock-photo-unsplash-2",
        type: "photo",
        source: "unsplash",
        title: "Developer workspace setup with triple monitors",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
        author: "Clément H",
        createdAt: new Date(Date.now() - 5000000).toISOString(),
        trendingScore: 840,
        width: 1200,
        height: 800,
        tags: ["coding", "technology", "setup", "office"]
    },
    {
        id: "mock-photo-unsplash-3",
        type: "photo",
        source: "unsplash",
        title: "Minimal whitewashed architecture in Greece",
        image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
        author: "Heidi Kaden",
        createdAt: new Date(Date.now() - 8000000).toISOString(),
        trendingScore: 690,
        width: 800,
        height: 1000,
        tags: ["greece", "architecture", "travel", "minimalist"]
    },
    {
        id: "mock-photo-unsplash-4",
        type: "photo",
        source: "unsplash",
        title: "Aesthetic fresh avocado toast breakfast and juice",
        image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80",
        author: "Ella Olsson",
        createdAt: new Date(Date.now() - 10000000).toISOString(),
        trendingScore: 580,
        width: 800,
        height: 800,
        tags: ["food", "lifestyle", "brunch", "healthy"]
    },
    {
        id: "mock-photo-unsplash-5",
        type: "photo",
        source: "unsplash",
        title: "Stairway path along mountain range under sun",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
        author: "Kal Visuals",
        createdAt: new Date(Date.now() - 12000000).toISOString(),
        trendingScore: 810,
        width: 800,
        height: 1200,
        tags: ["mountain", "nature", "travel", "landscape"]
    },
    {
        id: "mock-photo-unsplash-6",
        type: "photo",
        source: "unsplash",
        title: "Cute baby golden retriever playing in grass",
        image: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80",
        author: "PuppyLove99",
        createdAt: new Date(Date.now() - 3000000).toISOString(),
        trendingScore: 1100,
        width: 800,
        height: 1000,
        tags: ["cute", "pet", "dog", "animal"]
    },

    // Pexels Photos
    {
        id: "mock-photo-pexels-1",
        type: "photo",
        source: "pexels",
        title: "Beautiful dark forest road with foggy pines",
        image: "https://images.pexels.com/photos/15286/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800",
        author: "Luis del Río",
        createdAt: new Date(Date.now() - 6000000).toISOString(),
        trendingScore: 710,
        width: 800,
        height: 1200,
        tags: ["forest", "nature", "travel", "landscape"]
    },
    {
        id: "mock-photo-pexels-2",
        type: "photo",
        source: "pexels",
        title: "Neon Cyberpunk alleyway in Tokyo",
        image: "https://images.pexels.com/photos/1906658/pexels-photo-1906658.jpeg?auto=compress&cs=tinysrgb&w=800",
        author: "Vincent R.",
        createdAt: new Date(Date.now() - 9000000).toISOString(),
        trendingScore: 850,
        width: 800,
        height: 1000,
        tags: ["neon", "cyberpunk", "tokyo", "city", "technology"]
    },
    {
        id: "mock-photo-pexels-3",
        type: "photo",
        source: "pexels",
        title: "Golden gate bridge in foggy afternoon",
        image: "https://images.pexels.com/photos/2082949/pexels-photo-2082949.jpeg?auto=compress&cs=tinysrgb&w=800",
        author: "Sasha Prasastika",
        createdAt: new Date(Date.now() - 11000000).toISOString(),
        trendingScore: 620,
        width: 1200,
        height: 800,
        tags: ["travel", "bridge", "city", "landscape"]
    },
    {
        id: "mock-photo-pexels-4",
        type: "photo",
        source: "pexels",
        title: "Close up of code lines on screen",
        image: "https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=800",
        author: "Luis Gomes",
        createdAt: new Date(Date.now() - 15000000).toISOString(),
        trendingScore: 770,
        width: 800,
        height: 800,
        tags: ["coding", "technology", "development"]
    },
    {
        id: "mock-photo-pexels-5",
        type: "photo",
        source: "pexels",
        title: "Adorable fluffy red panda eating leaf",
        image: "https://images.pexels.com/photos/5461829/pexels-photo-5461829.jpeg?auto=compress&cs=tinysrgb&w=800",
        author: "NatureLover4",
        createdAt: new Date(Date.now() - 17000000).toISOString(),
        trendingScore: 990,
        width: 800,
        height: 1000,
        tags: ["cute", "animal", "red panda"]
    }
]

// ── UNSPLASH API FETCH ────────────────────────────────────────────────────────
export const fetchUnsplash = async (query = "", page = 1) => {
    if (!UNSPLASH_ACCESS_KEY) {
        console.log("Unsplash access key missing. Fallback to mock.")
        return []
    }
    try {
        let url = `https://api.unsplash.com/photos?page=${page}&per_page=20`
        if (query && query !== "all" && query !== "trending" && query !== "photos" && query !== "videos" && query !== "cute" && query !== "technology" && query !== "travel") {
            url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=20`
        }
        
        const res = await fetch(url, {
            headers: {
                Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
            }
        })
        const data = await res.json()
        const photos = Array.isArray(data) ? data : (data.results || [])
        
        return photos.map(photo => ({
            id: `unsplash-${photo.id}`,
            type: "photo",
            source: "unsplash",
            title: photo.description || photo.alt_description || "Stunning Photography",
            image: photo.urls?.regular || photo.urls?.full,
            video: null,
            author: photo.user?.name || photo.user?.username || "Unsplash Photographer",
            createdAt: photo.created_at || new Date().toISOString(),
            trendingScore: photo.likes || 0,
            width: photo.width || 600,
            height: photo.height || 800,
            tags: ["photo", "unsplash", ...(photo.tags?.map(t => t.title) || [])]
        }))
    } catch (error) {
        console.error("Error fetching Unsplash:", error.message)
        return []
    }
}

// ── PEXELS VIDEOS API FETCH ──────────────────────────────────────────────────
export const fetchPexels = async (query = "", page = 1) => {
    if (!PEXELS_API_KEY) {
        console.log("Pexels API key missing. Fallback to mock.")
        return []
    }
    try {
        let url = `https://api.pexels.com/videos/popular?page=${page}&per_page=15`
        if (query && query !== "all" && query !== "trending" && query !== "photos" && query !== "videos" && query !== "cute" && query !== "technology" && query !== "travel") {
            url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&page=${page}&per_page=15`
        }
        
        const res = await fetch(url, {
            headers: {
                Authorization: PEXELS_API_KEY
            }
        })
        const data = await res.json()
        const videos = data.videos || []

        return videos.map(video => {
            const file = video.video_files?.find(f => f.quality === "hd" || f.quality === "sd") || video.video_files?.[0]
            return {
                id: `pexels-video-${video.id}`,
                type: "video",
                source: "pexels",
                title: `Dynamic video captured by ${video.user?.name || "Creator"}`,
                image: video.image || video.video_pictures?.[0]?.picture || "",
                video: file?.link || "",
                author: video.user?.name || "Pexels Video Creator",
                createdAt: new Date().toISOString(),
                trendingScore: (video.duration * 10) + Math.floor(Math.random() * 100),
                width: video.width || 600,
                height: video.height || 800,
                duration: video.duration || 0,
                tags: ["video", "pexels", "clip", "cinematic"]
            }
        })
    } catch (error) {
        console.error("Error fetching Pexels Videos:", error.message)
        return []
    }
}

// ── PEXELS PHOTOS API FETCH ──────────────────────────────────────────────────
export const fetchPexelsPhotos = async (query = "", page = 1) => {
    if (!PEXELS_API_KEY) {
        console.log("Pexels Photo API key missing. Fallback to mock.")
        return []
    }
    try {
        let url = `https://api.pexels.com/v1/curated?page=${page}&per_page=15`
        if (query && query !== "all" && query !== "trending" && query !== "photos" && query !== "videos" && query !== "cute" && query !== "technology" && query !== "travel") {
            url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=15`
        }

        const res = await fetch(url, {
            headers: {
                Authorization: PEXELS_API_KEY
            }
        })
        const data = await res.json()
        const photos = data.photos || []

        return photos.map(photo => ({
            id: `pexels-photo-${photo.id}`,
            type: "photo",
            source: "pexels",
            title: photo.alt || "Visual art captured on camera",
            image: photo.src?.large || photo.src?.original,
            video: null,
            author: photo.photographer || "Pexels Photographer",
            createdAt: new Date().toISOString(),
            trendingScore: Math.floor(Math.random() * 150) + 20,
            width: photo.width || 600,
            height: photo.height || 800,
            tags: ["photo", "pexels", "visuals", "art"]
        }))
    } catch (error) {
        console.error("Error fetching Pexels Photos:", error.message)
        return []
    }
}

// ── AGGREGATION & SHUFFLE ─────────────────────────────────────────────────────
export const mergeFeeds = (videos, pexelsPhotos, unsplashPhotos, limit = 24) => {
    // Target Blend ratio: 50% Videos, 25% Pexels Photos, 25% Unsplash Photos
    const videoLimit = Math.max(1, Math.round(limit * 0.50))
    const pexelsPhotoLimit = Math.max(1, Math.round(limit * 0.25))
    const unsplashPhotoLimit = Math.max(1, limit - videoLimit - pexelsPhotoLimit)

    const selectedVideos = videos.slice(0, videoLimit)
    const selectedPexelsPhotos = pexelsPhotos.slice(0, pexelsPhotoLimit)
    const selectedUnsplashPhotos = unsplashPhotos.slice(0, unsplashPhotoLimit)

    const combined = [...selectedVideos, ...selectedPexelsPhotos, ...selectedUnsplashPhotos]

    // Fill the remainder if some sources ran empty
    let remainingVideos = videos.slice(videoLimit)
    let remainingPexels = pexelsPhotos.slice(pexelsPhotoLimit)
    let remainingUnsplash = unsplashPhotos.slice(unsplashPhotoLimit)

    while (combined.length < limit && (remainingVideos.length > 0 || remainingPexels.length > 0 || remainingUnsplash.length > 0)) {
        if (remainingVideos.length > 0 && combined.length < limit) {
            combined.push(remainingVideos.shift())
        }
        if (remainingPexels.length > 0 && combined.length < limit) {
            combined.push(remainingPexels.shift())
        }
        if (remainingUnsplash.length > 0 && combined.length < limit) {
            combined.push(remainingUnsplash.shift())
        }
    }

    return combined
}

export const shuffleFeeds = (array) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

// ── CONTROLLER ACTIONS ────────────────────────────────────────────────────────

// GET /api/explore
export const getExploreFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 24
        const category = req.query.category || "Trending"
        const search = req.query.search || ""

        const cacheKey = `explore:feed:v2:${category}:${search}:p${page}:l${limit}`
        const cachedResponse = await getCached(cacheKey)
        if (cachedResponse) {
            return res.status(200).json(cachedResponse)
        }

        const hasKeys = PEXELS_API_KEY && UNSPLASH_ACCESS_KEY
        let finalFeed = []

        if (!hasKeys) {
            // Apply filtering/search on Mock Dataset
            let tempFeed = [...MOCK_ITEMS]

            // 1. Category filter on Mock
            if (category && category !== "Trending") {
                const lowerCat = category.toLowerCase()
                tempFeed = tempFeed.filter(item => {
                    if (lowerCat === "photos") return item.type === "photo"
                    if (lowerCat === "videos") return item.type === "video"
                    if (lowerCat === "cute") return item.tags?.includes("cute") || item.tags?.includes("red panda")
                    if (lowerCat === "technology") return item.tags?.includes("coding") || item.tags?.includes("technology")
                    if (lowerCat === "travel") return item.tags?.includes("travel")
                    return true
                })
            }

            // 2. Search filter on Mock
            if (search) {
                const lowerQuery = search.toLowerCase()
                tempFeed = tempFeed.filter(item => 
                    item.title?.toLowerCase().includes(lowerQuery) ||
                    item.author?.toLowerCase().includes(lowerQuery) ||
                    item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
                )
            }

            // 3. Pagination & Ordering
            if (category === "Trending") {
                tempFeed.sort((a, b) => b.trendingScore - a.trendingScore)
            } else {
                tempFeed = shuffleFeeds(tempFeed)
            }

            const startIndex = (page - 1) * limit
            finalFeed = tempFeed.slice(startIndex, startIndex + limit)

        } else {
            // Live API Aggregation
            let query = search

            // Map category rules to queries
            if (category && category !== "Trending") {
                const lowerCat = category.toLowerCase()
                if (lowerCat === "photos") query = "aesthetic"
                else if (lowerCat === "videos") query = "cinematic"
                else if (lowerCat === "cute") query = "animals"
                else if (lowerCat === "technology") query = "technology coding"
                else if (lowerCat === "travel") query = "travel landscape"
            }

            let pexelsVideosPromise = Promise.resolve([])
            let pexelsPhotosPromise = Promise.resolve([])
            let unsplashPhotosPromise = Promise.resolve([])

            if (category.toLowerCase() !== "photos") {
                pexelsVideosPromise = fetchPexels(query || "popular", page)
            }
            if (category.toLowerCase() !== "videos") {
                pexelsPhotosPromise = fetchPexelsPhotos(query || "creative", page)
                unsplashPhotosPromise = fetchUnsplash(query || "curated", page)
            }

            const [videos, pexelsPhotos, unsplashPhotos] = await Promise.all([
                pexelsVideosPromise,
                pexelsPhotosPromise,
                unsplashPhotosPromise
            ])

            // Blend the feeds based on target ratio: 50% Pexels Videos, 25% Pexels Photos, 25% Unsplash Photos
            let blended = []
            if (category.toLowerCase() === "photos") {
                // If only photos, blend 50% Pexels Photos and 50% Unsplash Photos
                const pxLimit = Math.floor(limit / 2)
                const unLimit = limit - pxLimit
                blended = [...pexelsPhotos.slice(0, pxLimit), ...unsplashPhotos.slice(0, unLimit)]
            } else if (category.toLowerCase() === "videos") {
                // If only videos, return Pexels Videos
                blended = videos.slice(0, limit)
            } else {
                // Blend standard ratio
                blended = mergeFeeds(videos, pexelsPhotos, unsplashPhotos, limit)
            }

            // Filter search queries locally if needed
            if (search) {
                const lowerSearch = search.toLowerCase()
                blended = blended.filter(item => 
                    item.title?.toLowerCase().includes(lowerSearch) ||
                    item.author?.toLowerCase().includes(lowerSearch) ||
                    item.tags?.some(t => t.toLowerCase().includes(lowerSearch))
                )
            }

            // Sort or shuffle depending on tab
            if (category === "Trending") {
                blended.sort((a, b) => b.trendingScore - a.trendingScore)
            } else {
                blended = shuffleFeeds(blended)
            }

            finalFeed = blended
        }

        const responseObj = {
            feed: finalFeed,
            page,
            limit,
            category,
            search
        }

        await setCached(cacheKey, responseObj)
        return res.status(200).json(responseObj)

    } catch (error) {
        console.error("getExploreFeed error:", error)
        return res.status(500).json({ message: `Failed to compile explore feed: ${error.message}` })
    }
}

// GET /api/explore/photos
export const getPhotosFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const search = req.query.search || ""

        let photos = []
        if (UNSPLASH_ACCESS_KEY) {
            photos = await fetchUnsplash(search || "curated", page)
        } else {
            photos = MOCK_ITEMS.filter(item => item.type === "photo")
        }

        return res.status(200).json({ photos })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

// GET /api/explore/videos
export const getVideosFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const search = req.query.search || ""

        let videos = []
        if (PEXELS_API_KEY) {
            videos = await fetchPexels(search || "popular", page)
        } else {
            videos = MOCK_ITEMS.filter(item => item.type === "video")
        }

        return res.status(200).json({ videos })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}
