import Redis from "ioredis"

// ─── Redis Configuration ───────────────────────────────────────────────────────
// Supports: REDIS_URL | REDIS_HOST + REDIS_PORT + REDIS_USERNAME + REDIS_PASSWORD
// Auto-detects TLS from rediss:// or REDIS_TLS=true
// Falls back to non-TLS if TLS handshake fails (common Redis Cloud misconfig)
// Falls back to no-op stub so no API route crashes when Redis is unavailable

const buildStub = () => ({
    get: async () => null,
    set: async () => null,
    setex: async () => null,
    del: async () => null,
    incr: async () => 0,
    expire: async () => null,
    ttl: async () => -1,
    publish: async () => null,
    subscribe: async () => null,
    ping: async () => "PONG (stub)",
    quit: async () => null,
    disconnect: () => null,
    isStub: true,
    isReady: false,
    status: "stub"
})

const parseRedisConfig = () => {
    const url = process.env.REDIS_URL?.trim()

    if (url) {
        try {
            const parsed = new URL(url)
            return {
                host: parsed.hostname,
                port: parseInt(parsed.port, 10) || 6379,
                username: decodeURIComponent(parsed.username || "default"),
                password: decodeURIComponent(parsed.password || ""),
                preferTls: parsed.protocol === "rediss:" || process.env.REDIS_TLS === "true"
            }
        } catch (e) {
            console.error("❌ Invalid REDIS_URL:", e.message)
        }
    }

    const host = process.env.REDIS_HOST?.trim()
    if (!host) return null

    return {
        host,
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        username: process.env.REDIS_USERNAME || "default",
        password: process.env.REDIS_PASSWORD || "",
        preferTls: process.env.REDIS_TLS === "true"
    }
}

const createClient = ({ host, port, username, password, useTls, forTest = false }) => {
    const options = {
        host,
        port,
        username: username || undefined,
        password: password || undefined,
        maxRetriesPerRequest: forTest ? 1 : 2,
        enableReadyCheck: true,
        lazyConnect: true,
        connectTimeout: 10000,
        retryStrategy: forTest
            ? () => null
            : (times) => {
                if (times > 3) return null
                return Math.min(times * 500, 3000)
            }
    }

    if (useTls) {
        options.tls = {
            rejectUnauthorized: false,
            servername: host
        }
    }

    return new Redis(options)
}

const testConnection = async (client, label) => {
    try {
        await client.connect()
        const pong = await client.ping()
        if (pong !== "PONG") {
            throw new Error(`Unexpected ping response: ${pong}`)
        }
        console.log(`✅ Redis Connected (${label})`)
        console.log("✅ Redis Ping Success:", pong)
        client.isStub = false
        client.isReady = true
        return true
    } catch (err) {
        console.warn(`⚠️  Redis ${label} failed:`, err.message.split("\n")[0])
        try { client.disconnect() } catch (_) { /* ignore */ }
        return false
    }
}

let redisClient = buildStub()

const attachEventHandlers = (client) => {
    client.on("error", (err) => {
        console.error("❌ Redis error:", err.message.split("\n")[0])
    })
    client.on("close", () => {
        if (!client.isStub) console.warn("⚠️  Redis connection closed")
    })
    client.on("reconnecting", () => {
        if (!client.isStub) console.log("🔄 Redis reconnecting...")
    })
}

export const initRedis = async () => {
    const config = parseRedisConfig()

    if (!config) {
        console.warn("⚠️  Redis not configured — running in cache-safe mode (no caching)")
        redisClient = buildStub()
        return redisClient
    }

    const { host, port, username, password, preferTls } = config
    console.log(`🔌 Redis target: ${host}:${port} (TLS preferred: ${preferTls})`)

    const strategies = preferTls
        ? [
            { useTls: true, label: "TLS" },
            { useTls: false, label: "non-TLS fallback" }
        ]
        : [{ useTls: false, label: "non-TLS" }]

    for (const { useTls, label } of strategies) {
        const client = createClient({ host, port, username, password, useTls, forTest: true })

        if (await testConnection(client, label)) {
            attachEventHandlers(client)
            redisClient = client
            return redisClient
        }
    }

    console.error("❌ Redis unavailable — switching to cache-safe mode (stub)")
    redisClient = buildStub()
    return redisClient
}

// Safe wrapper: if real client throws at runtime, degrade gracefully
const safeProxy = (fn) => async (...args) => {
    if (redisClient.isStub) return fn === "incr" ? 0 : null
    try {
        return await redisClient[fn](...args)
    } catch (err) {
        console.error(`Redis ${fn} error (non-fatal):`, err.message)
        return fn === "incr" ? 0 : null
    }
}

export const getRedis = () => redisClient

export default new Proxy({}, {
    get(_, prop) {
        if (prop === "isStub") return redisClient.isStub ?? true
        if (prop === "isReady") return redisClient.isReady ?? false
        if (typeof redisClient[prop] === "function") {
            if (["get", "set", "setex", "del", "incr", "expire", "ttl", "ping"].includes(prop)) {
                return safeProxy(prop)
            }
            return redisClient[prop].bind(redisClient)
        }
        return redisClient[prop]
    }
})
