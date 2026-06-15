import redis from "../config/redis.js"

// Brute-force rate limiter using Redis
// Allows MAX_ATTEMPTS failed logins per IP per WINDOW_SECONDS
// After that, returns 429 with Retry-After header

const MAX_ATTEMPTS = 5
const WINDOW_SECONDS = 15 * 60  // 15 minutes

const rateLimiter = async (req, res, next) => {
    // Skip if Redis is not configured (stub mode)
    if (redis.isStub) return next()

    // Key by IP address
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown"
    const key = `login_attempts:${ip}`

    try {
        const attempts = await redis.incr(key)

        // On first attempt, set the expiry window
        if (attempts === 1) {
            await redis.expire(key, WINDOW_SECONDS)
        }

        if (attempts > MAX_ATTEMPTS) {
            const ttl = await redis.ttl(key)
            return res.status(429).json({
                message: `Too many login attempts. Try again in ${Math.ceil(ttl / 60)} minute(s).`,
                retryAfter: ttl
            })
        }

        // Attach remaining attempts info to request for logging
        req.loginAttempts = attempts
        next()
    } catch (err) {
        // If Redis fails, don't block the user — log and continue
        console.error("rateLimiter Redis error:", err.message)
        next()
    }
}

export default rateLimiter
