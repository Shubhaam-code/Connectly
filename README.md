# 📸 Connectly

A modern, full-stack social media platform inspired by Instagram — built with the MERN stack and enhanced with real-time communication and AI-powered features. Connectly supports posts, stories, short-form video "Loops" (reels), direct messaging, live notifications, a curated explore feed, an AI news digest, and an AI companion chatbot, all wrapped in a polished, responsive UI.

🔗 **Live demo:** [connectly-ebon.vercel.app](https://connectly-ebon.vercel.app)

---

## ✨ Features

- 🔐 **Secure authentication** — signup/signin with bcrypt password hashing, JWT access + refresh token rotation, optional email-based Two-Factor Authentication (2FA), OTP-based password reset, brute-force lockout protection, and multi-device session management.
- 🖼️ **Posts** — upload images/videos, like, comment, nested replies, comment/reply likes, @mentions with notifications, save/bookmark posts, and delete posts.
- 🎬 **Loops (Reels)** — short-form vertical video uploads with likes and comments, similar to Instagram Reels/TikTok.
- 📖 **Stories** — 24-hour expiring image/video stories with view tracking and per-user story rings.
- 💬 **Real-time chat** — one-to-one messaging with text, images, video, and audio, message reactions, edit/delete, reply-to, typing indicators, read receipts, and shared posts/loops/stories — all powered by Socket.IO.
- 🔔 **Live notifications** — instant in-app notifications for likes, comments, follows, mentions, messages, and story reactions via WebSockets.
- 🧭 **Explore feed** — a curated, shuffled discovery feed blending video and photo content sourced from Pexels and Unsplash.
- 👥 **Social graph** — follow/unfollow, suggested users, followers/following lists, and user search.
- 📊 **Creator analytics** — profile visit tracking, post/story/profile impressions, visitor insights, and engagement event tracking.
- 🤖 **AI Caption Generator** — upload an image and get 5 auto-generated caption styles (Short, Medium, Viral, Professional, Funny) using a vision-capable LLM.
- 🧑‍🤝‍🧑 **AI Friend Chatbot** — a warm, persona-driven AI companion with streaming responses and conversational memory.
- 📰 **AI-powered news feed** — live tech/AI/startup/social-media news pulled from GNews, automatically categorized, scored for "trending" relevance, and summarized by an LLM.
- ⚙️ **Account & privacy settings** — profile visibility, post/story visibility, message permissions, blocked/muted users, notification preferences, active session management (view & revoke devices), support ticket submission, and account deletion.
- 🌓 **Polished UI/UX** — animated transitions (Framer Motion), responsive layout, dark/light theming, splash screen, and toast-driven feedback.

---

## 🛠️ Tech Stack

**Frontend**
- React 19 (Vite)
- Redux Toolkit + React-Redux (state management)
- React Router v7
- Tailwind CSS v4
- Framer Motion (animations)
- Axios (HTTP client with silent token-refresh interceptor)
- Socket.IO Client (real-time events)
- Lucide React / React Icons
- date-fns, React Spinners, React Intersection Observer

**Backend**
- Node.js + Express 5
- MongoDB + Mongoose (ODM)
- Socket.IO (real-time WebSocket server)
- JSON Web Tokens (`jsonwebtoken`) for access/refresh auth
- bcryptjs for password hashing
- Multer for multipart file uploads
- Nodemailer (Gmail SMTP) for OTP/2FA emails
- Redis (`ioredis`) for caching, sessions, and rate limiting — with automatic in-memory stub fallback if unavailable

**AI / LLM Services**
- **Groq SDK** — primary LLM provider for the AI Friend chatbot, AI caption generation (vision model), news summarization, and text simplification
  - Text model: `llama-3.3-70b-versatile`
  - Vision model: `meta-llama/llama-4-scout-17b-16e-instruct`

**Third-Party Integrations**
- **Cloudinary** — media storage/CDN for posts, loops, stories, and message attachments
- **GNews API** — live news article sourcing
- **Pexels API** & **Unsplash API** — explore feed photo/video content
- **Gmail SMTP (Nodemailer)** — transactional email for OTP and 2FA codes

**Deployment**
- Frontend: Vercel
- Backend: Render

---

## 🖼️ Screenshots

> Add screenshots or a demo GIF of the app here to give visitors a quick visual overview.

| Home Feed | Loops (Reels) | Messages |
|---|---|---|
| _Add screenshot_ | _Add screenshot_ | _Add screenshot_ |

| Explore | AI Friend Chat | Settings |
|---|---|---|
| _Add screenshot_ | _Add screenshot_ | _Add screenshot_ |

---

## 📁 Project Structure

```
Connectly/
├── backend/
│   ├── config/            # Service configuration (DB, Redis, Cloudinary, Mail, JWT)
│   ├── controllers/        # Route handler business logic (auth, posts, loops, stories, etc.)
│   ├── middlewares/         # isAuth (JWT verification + refresh), multer (uploads), rateLimiter
│   ├── models/              # Mongoose schemas (User, Post, Loop, Story, Message, etc.)
│   ├── routes/               # Express route definitions, grouped by resource
│   ├── services/              # groqService.js — Groq LLM wrapper (text + vision)
│   ├── public/                  # Temporary local upload storage (auto-created, cleared after Cloudinary upload)
│   ├── socket.js                  # Socket.IO server setup, online-user tracking, typing events
│   └── index.js                    # Express app entry point, route mounting, server bootstrap
│
└── frontend/
    ├── src/
    │   ├── pages/             # Top-level route components (Home, Profile, Messages, Settings, etc.)
    │   ├── components/         # Reusable UI components, organized by feature (chat, explore, stories…)
    │   ├── redux/                # Redux Toolkit slices (user, post, story, loop, message, socket, etc.)
    │   ├── hooks/                  # Custom data-fetching hooks (getCurrentUser, getAllPost, etc.)
    │   ├── context/                  # SocketContext — provides the Socket.IO client instance app-wide
    │   ├── lib/                       # axiosInstance.js — centralized API client w/ auto token refresh
    │   └── utils/                      # Shared constants and formatters
    ├── public/                          # Static assets (logo, backgrounds, manifest)
    └── vite.config.js                     # Vite + Tailwind plugin configuration
```

---

## ⚙️ Installation

### Prerequisites
- Node.js (v18+ recommended)
- npm
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A Redis instance (optional — the app degrades gracefully to a no-op stub if not configured)
- API keys/accounts for: Cloudinary, Groq, GNews, Pexels, Unsplash, and a Gmail account with an App Password

### 1. Clone the repository
```bash
git clone https://github.com/Shubhaam-code/Connectly.git
cd Connectly
```

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

### 4. Configure environment variables
Create a `.env` file inside `backend/` (see [Environment Variables](#-environment-variables) below).

> ⚠️ **Note:** The frontend does not use a `.env` file — the backend URL is resolved automatically in `src/lib/axiosInstance.js` based on hostname (`localhost` → `http://localhost:8000`, otherwise the deployed Render URL). Update this file if you deploy your own backend instance.

---

## 🔑 Environment Variables

All environment variables are configured in **`backend/.env`**.

| Variable | Description | Required |
|---|---|---|
| `PORT` | Port the Express server listens on (defaults to `5000`) | No |
| `MONGODB_URL` | MongoDB connection string | ✅ Yes |
| `JWT_ACCESS_SECRET` | Secret used to sign short-lived access tokens | ✅ Yes |
| `JWT_REFRESH_SECRET` | Secret used to sign long-lived refresh tokens | ✅ Yes |
| `JWT_SECRET` | Legacy secret kept for backward-compatible token verification | ✅ Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name | ✅ Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ Yes |
| `EMAIL` | Gmail address used to send OTP/2FA emails via Nodemailer | ✅ Yes |
| `EMAIL_PASS` | Gmail App Password (not your regular Gmail password) | ✅ Yes |
| `GROQ_API_KEY` | API key for Groq (powers AI Friend chat, captions, news summarization) | ✅ Yes |
| `GNEWS_API_KEY` | API key for [GNews](https://gnews.io) (news feed articles) | ✅ Yes |
| `PEXELS_API_KEY` | API key for [Pexels](https://www.pexels.com/api/) (explore feed videos/photos) | ✅ Yes |
| `UNSPLASH_ACCESS_KEY` | Access key for [Unsplash](https://unsplash.com/developers) (explore feed photos) | ✅ Yes |
| `REDIS_URL` | Full Redis connection URL (e.g. from Redis Cloud); alternative to individual host/port vars | No |
| `REDIS_HOST` | Redis host (used if `REDIS_URL` is not set) | No |
| `REDIS_PORT` | Redis port | No |
| `REDIS_USERNAME` | Redis username | No |
| `REDIS_PASSWORD` | Redis password | No |
| `REDIS_TLS` | Set to `true` to force TLS for Redis connection | No |
| `NODE_ENV` | Set to `production` in deployed environments (affects cookie security flags & logging) | No |
| `RENDER` | Set to `true` when deployed on Render (also affects cookie security flags) | No |

> 💡 If Redis variables are omitted, the backend automatically falls back to a safe in-memory stub — caching, rate limiting, and sessions are simply disabled rather than the app crashing.

---

## ▶️ Running Locally

### Start the backend (default: `http://localhost:5000`, frontend expects `http://localhost:8000` — set `PORT=8000` in `.env` for local dev)
```bash
cd backend
npm run dev      # nodemon — auto-restarts on file changes
# or
npm start        # plain node
```

### Start the frontend (default: `http://localhost:5173`)
```bash
cd frontend
npm run dev
```

Then open `http://localhost:5173` in your browser. Make sure the backend is running on `http://localhost:8000` (per `axiosInstance.js`), or update that file to match your local backend port.

---

## 📡 API Endpoints

All endpoints are prefixed with `/api`. Routes marked 🔒 require authentication (valid `accessToken`/`refreshToken` cookies).

### Auth — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/signup` | Register a new user. Body: `{ name, email, password, userName }` |
| POST | `/signin` | Login with username/email + password. Body: `{ identifier, password, rememberMe }` |
| POST | `/verify-2fa` | Verify a 2FA OTP code after signin. Body: `{ email, otp }` |
| POST | `/switch-account` | Switch between multiple logged-in accounts using a stored refresh token |
| POST | `/refresh-token` | Silently rotate access/refresh tokens using the refresh cookie |
| GET | `/signout` 🔒 | Log out, clear cookies, and revoke the session |
| POST | `/sendOtp` / `/forgot-password` | Send a password-reset OTP to the user's email |
| POST | `/verifyOtp` | Verify a password-reset OTP |
| POST | `/resetPassword` / `/reset-password` | Reset password after OTP verification |

**Example — Sign in:**
```http
POST /api/auth/signin
Content-Type: application/json

{ "identifier": "shubham123", "password": "secret123", "rememberMe": true }
```
```json
// 200 OK
{ "_id": "65f...", "name": "Shubham", "userName": "shubham123", "email": "shubham@example.com", "refreshToken": "eyJ..." }
```

### Users — `/api/user`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/current` 🔒 | Get the currently authenticated user |
| GET | `/suggested` 🔒 | Get suggested users to follow |
| GET | `/getProfile/:userName` 🔒 | Get a user's public profile |
| GET | `/follow/:targetUserId` 🔒 | Follow/unfollow a user (toggle) |
| GET | `/followingList` 🔒 | Get the current user's following list |
| GET | `/search?query=` 🔒 | Search users by name/username |
| GET | `/getAllNotifications` 🔒 | Get all notifications |
| POST | `/markAsRead` 🔒 | Mark notifications as read |
| GET | `/saved-posts` 🔒 | Get the current user's saved/bookmarked posts |
| POST | `/editProfile` 🔒 | Update profile (multipart: `profileImage`, `coverImage`, text fields) |
| GET | `/analytics` 🔒 | Get aggregated personal analytics |
| GET | `/sessions` 🔒 | List active login sessions/devices |
| DELETE | `/sessions/:sessionId` 🔒 | Revoke a specific session |
| POST | `/support` 🔒 | Submit a support ticket |
| DELETE | `/delete-account` 🔒 | Permanently delete the account |

### Posts — `/api/post`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/upload` 🔒 | Upload a post (multipart: `media`, body: `caption`, `mediaType`) |
| GET | `/getAll` 🔒 | Get all posts (feed) |
| GET | `/like/:postId` 🔒 | Like/unlike a post |
| GET | `/saved/:postId` 🔒 | Save/unsave a post |
| POST | `/comment/:postId` 🔒 | Add a comment (supports `parentComment` for replies) |
| GET | `/comment/like/:postId/:commentId` 🔒 | Like/unlike a comment |
| GET | `/comment/reply/like/:postId/:commentId/:replyId` 🔒 | Like/unlike a reply |
| DELETE | `/delete/:postId` 🔒 | Delete a post (author only) |
| POST | `/track/open/:postId` 🔒 | Track a post-open analytics event |
| POST | `/track/impression` 🔒 | Track a post-impression analytics event |

**Example — Upload a post:**
```http
POST /api/post/upload
Content-Type: multipart/form-data
Cookie: accessToken=...

media: <file>
mediaType: "image"
caption: "Loving this view! @friend"
```
```json
// 201 Created
{ "_id": "66a...", "author": { "_id": "...", "name": "Shubham", "userName": "shubham123" }, "media": "https://res.cloudinary.com/...", "mediaType": "image", "caption": "Loving this view! @friend", "likes": [], "comments": [] }
```

### Loops (Reels) — `/api/loop`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/upload` 🔒 | Upload a loop/reel (multipart: `media`) |
| GET | `/getAll` 🔒 | Get all loops |
| GET | `/like/:loopId` 🔒 | Like/unlike a loop |
| POST | `/comment/:loopId` 🔒 | Comment on a loop |

### Stories — `/api/story`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/upload` 🔒 | Upload a story (multipart: `media`) |
| GET | `/getByUserName/:userName` 🔒 | Get a user's active stories |
| GET | `/getAll` 🔒 | Get all stories from followed users |
| GET | `/view/:storyId` 🔒 | Mark a story as viewed |
| DELETE | `/:storyId` 🔒 | Delete a story (author only) |

### Messages — `/api/message`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/send/:receiverId` 🔒 | Send a message (text and/or multipart `image`) |
| GET | `/getAll/:receiverId` 🔒 | Get full conversation with a user |
| GET | `/prevChats` 🔒 | Get conversation list (inbox) |
| PUT | `/seen/:chatId` 🔒 | Mark messages as seen |
| POST | `/reaction/:messageId` 🔒 | Toggle an emoji reaction on a message |
| PUT | `/edit/:messageId` 🔒 | Edit a sent message |
| DELETE | `/delete/:messageId` 🔒 | Delete a message |

### Explore — `/api/explore`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` 🔒 | Get the blended explore feed (videos + photos) |
| GET | `/photos` 🔒 | Get a photos-only explore feed |
| GET | `/videos` 🔒 | Get a videos-only explore feed |

### News — `/api/news`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get paginated news (`?page=&limit=&category=`) |
| GET | `/trending` | Get top 10 trending articles by score |
| GET | `/category?cat=` | Get news filtered by category |
| POST | `/summarize` | Summarize/simplify arbitrary text. Body: `{ text, mode }` |

### AI Chat & Caption
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat` | General AI chat (SSE streaming by default). Body: `{ message, stream }` |
| POST | `/api/friend/chat` | AI Friend conversational chat with message history (SSE streaming). Body: `{ messages: [...] }` |
| POST | `/api/caption/generate` 🔒 | Generate 5 AI captions from an uploaded image (multipart: `image`, optional `vibe`) |

### Analytics — `/api/analytics`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/track` 🔒 | Log a generic tracking event |
| GET | `/profile` 🔒 | Profile-level analytics summary |
| GET | `/impressions` 🔒 | Impressions analytics |
| GET | `/visitors` 🔒 | Visitor analytics |

---

## 🔐 Authentication Flow

1. **Sign up / Sign in** — passwords are hashed with bcrypt (12 salt rounds). On success, the server issues an **access token** (15 min, or 30 days with "Remember Me") and a **refresh token** (7 days), both set as `httpOnly` cookies (`accessToken`, `refreshToken`, plus a legacy `token` cookie for backward compatibility).
2. **Two-Factor Authentication (optional)** — if enabled on the account, sign-in returns `{ twoFactorRequired: true }` instead of tokens, and a 4-digit OTP is emailed via Nodemailer/Gmail. The client then calls `/api/auth/verify-2fa` with the OTP to receive tokens.
3. **Protected routes** — the `isAuth` middleware reads the access token cookie, verifies it (trying the new secret, then the legacy secret for backward compatibility), and attaches `req.userId`. It also refreshes a Redis-backed session TTL when Redis is available.
4. **Silent token refresh** — if the access token is expired, `isAuth` automatically validates the refresh token, issues new access/refresh tokens, and proceeds — no re-login required. On the frontend, `axiosInstance.js` mirrors this: any `401` response triggers a call to `/api/auth/refresh-token` and retries the original request once.
5. **Logout/session expiry** — if refresh also fails, the frontend dispatches a global `auth:logout` event, clearing Redux user state and redirecting to `/signin`.
6. **Brute-force protection** — a Redis-backed rate limiter caps sign-in attempts to 5 per IP per 15 minutes; additionally, the `User` model tracks `loginAttempts` and applies a 30-minute account lock after 10 failed password attempts.
7. **Password reset** — OTP-based flow: `sendOtp` → email OTP → `verifyOtp` → `resetPassword`, with all existing sessions invalidated upon a successful reset.
8. **Multi-account / session management** — users can switch between accounts (`switchAccount`) and view/revoke individual active sessions (tracked in the `Session` model with device/browser/OS metadata).

---

## 🗄️ Database Schema

MongoDB (via Mongoose). Key collections and relationships:

- **User** — central entity. Holds profile info, `followers`/`following` (self-referencing arrays of `User`), `posts`/`loops`/`saved` (arrays of references), privacy/notification preferences, 2FA and OTP fields, and brute-force lockout fields.
- **Post** — references `author` (`User`). Embeds `likes` (array of `User` refs) and `comments`, where each comment embeds its own `author`, `likes`, and nested `replies` (each reply also has its own `author` and `likes`) — a self-contained comment thread model.
- **Loop** — references `author` (`User`); structurally similar to `Post` but simpler (single-level `comments`, no nested replies).
- **Story** — references `author` (`User`); has a TTL index (`expires: 86400`) so MongoDB automatically deletes stories 24 hours after creation. Tracks `viewers` (array of `User` refs).
- **Conversation** — references `participants` (array of `User`) and `messages` (array of `Message` refs); groups a 1:1 chat thread.
- **Message** — references `sender`/`receiver` (`User`), supports `messageType` (`text`/`image`/`video`/`audio`), `reactions` (array of `{ user, emoji }`), `replyTo` (self-reference to another `Message`), and optional links to a `sharedPost`/`sharedLoop`/`sharedStory`.
- **Notification** — references `sender`/`receiver` (`User`) and optionally a `post`/`loop`; typed via an enum (`like`, `comment`, `follow`, `mention`, `message`, etc.).
- **Session** — references `user` (`User`); stores the `refreshToken`, device/browser/OS metadata, and `lastActive` timestamp for session management.
- **Tracking** — references `owner` (`User`) and optionally `visitor`/`post`/`loop`/`story`; records granular analytics events (`profile_visit`, `post_like`, `post_impression`, etc.) that power the Creator Insights/analytics dashboards.
- **SupportTicket** — references `user` (`User`); stores `category` and `message` for the in-app Help Center submissions.

**Relationship summary:** `User` is the hub that nearly every other collection references. `Post`/`Loop` own embedded comment subdocuments rather than a separate `Comment` collection. `Message` documents are grouped logically by a `Conversation`, while `Tracking` and `Notification` act as event/activity logs tied back to `User` and content documents.

---

## 🧠 AI Integration

Connectly integrates **Groq** as its LLM provider (via the official `groq-sdk`), wrapped in a reusable service layer (`backend/services/groqService.js`) that handles message formatting, retries with exponential backoff, request timeouts (12s default), and a request-rate guard.

| Feature | Model | Mode | Description |
|---|---|---|---|
| **AI Friend Chatbot** | `llama-3.3-70b-versatile` | Streaming (SSE) | A persona-driven companion ("Friend") that responds warmly and casually, maintaining conversational context from the message history sent by the client. Powers both `/api/chat` and `/api/friend/chat`. |
| **AI Caption Generator** | `meta-llama/llama-4-scout-17b-16e-instruct` (vision) | Single response (JSON) | The uploaded image is base64-encoded and sent to the vision model with a structured prompt requesting 5 caption styles (Short, Medium, Viral, Professional, Funny) as strict JSON. |
| **News Summarization** | `llama-3.3-70b-versatile` | Single response | Each fetched news article's title/description is summarized into a 50–80 word factual paragraph, cached in Redis to avoid repeat API calls. |
| **Text Summarize/Simplify** | `llama-3.3-70b-versatile` | Single response | Generic endpoint (`/api/news/summarize`) that either summarizes or simplifies arbitrary user-submitted text. |

**Workflow highlights:**
- All LLM calls are routed through `generateAIResponse()` (text) or `generateVisionResponse()` (image+text), which validate input, strip unsupported content types (images/audio/attachments in chat history), and gracefully degrade on failure with a friendly fallback message rather than a raw error.
- Chat-based features use **Server-Sent Events (SSE)** for token-by-token streaming to the frontend.
- Both a Redis-backed and an in-memory rate limiter guard the AI endpoints (e.g., 20 requests/minute per IP for general chat) to control API costs and abuse.

---

## 🚀 Deployment

The project is structured as two independently deployable services:

### Frontend (Vercel)
1. Import the repository into Vercel and set the **root directory** to `frontend`.
2. Build command: `npm run build` · Output directory: `dist` (Vite defaults).
3. The included `vercel.json` adds an SPA rewrite rule (`/* → /index.html`) so client-side routing works correctly on refresh/deep links.
4. No frontend environment variables are required by default; if deploying your own backend, update the `SERVER_URL` logic in `src/lib/axiosInstance.js` to point to it.

### Backend (Render)
1. Create a new **Web Service** on Render, pointing to the `backend` directory.
2. Build command: `npm install` · Start command: `npm start`.
3. Add all required variables from the [Environment Variables](#-environment-variables) table in the Render dashboard, and set `RENDER=true` (the codebase already checks for this to enable secure cross-site cookies).
4. Ensure your MongoDB and Redis instances (e.g., MongoDB Atlas, Redis Cloud) allow connections from Render's IP range.
5. Update the `allowedOrigins` array in `backend/index.js` and `backend/socket.js` if deploying the frontend to a custom domain (currently allows the production Vercel URL, any `*.vercel.app` subdomain, and localhost).

---

## 🐞 Error Handling

Common issues and how the codebase handles or surfaces them:

| Issue | Cause | Resolution |
|---|---|---|
| `❌ MongoDB connection error` | Invalid/missing `MONGODB_URL` or network/IP-allowlist issue | Verify the connection string and that your IP is whitelisted in MongoDB Atlas |
| `☁️ Cloudinary upload error` / `403 Forbidden` | Missing or incorrect Cloudinary credentials | Double-check `CLOUDINARY_CLOUD_NAME`/`API_KEY`/`API_SECRET` in `.env` |
| `401 Authentication required` | Missing/expired cookies, or cross-origin cookie blocking | Ensure `withCredentials: true` on requests and matching `sameSite`/CORS configuration between frontend and backend domains |
| `429 Too many login attempts` | Rate limiter triggered (5 attempts/15 min) or account lockout (10 failed attempts) | Wait for the cooldown window indicated in the response, or use the password-reset flow |
| `Unsupported file type` (uploads) | File type not in Multer's allowlist | Use one of the supported image/video/audio formats (jpg, png, webp, mp4, mov, webm, mp3, etc.) |
| `GROQ_API_KEY is not defined` | Missing Groq key | Add a valid key to `.env`; AI features will otherwise fail at request time (the server itself still boots) |
| News feed returns empty | Missing/invalid `GNEWS_API_KEY`, or GNews API quota exceeded | Verify the key and check GNews dashboard usage limits |
| Redis warnings on startup (`⚠️ Redis not configured`) | No Redis env vars set | This is non-fatal by design — the app automatically falls back to a no-op stub (caching/rate-limiting simply disabled) |
| Socket events not firing | CORS origin mismatch in `socket.js`, or client connecting before `userData` is loaded | Confirm the frontend origin is in `allowedOrigins`, and that the socket is only initialized once the user is authenticated |

---

## 🗺️ Future Improvements

- Add automated test coverage (unit/integration tests for controllers and React components)
- Introduce TypeScript across both frontend and backend for stronger type safety
- Add an `.env.example` file to streamline onboarding for new contributors
- Move temporary uploads to in-memory/streaming storage instead of disk before forwarding to Cloudinary
- Add push notification support (Web Push/FCM) instead of in-app-only notifications
- Expand AI features with personalized content recommendations and AI-assisted moderation
- Add end-to-end encryption for direct messages
- Add admin/moderation dashboard for content reports and user management
- Migrate from polling-based UI refreshes (e.g., `prevChats`) toward fully event-driven socket updates where applicable
- Add CI/CD pipelines (GitHub Actions) for automated linting, testing, and deployment

---

## 📄 License

No `LICENSE` file is currently present in this repository. Until one is added, all rights are reserved by the repository owner ([Shubhaam-code](https://github.com/Shubhaam-code)). If you intend to open-source this project, consider adding an [MIT](https://choosealicense.com/licenses/mit/) or similar license.

---

## ❓ Assumptions / Missing Information

The following items could not be confirmed directly from the repository's code and are noted here for transparency:

- **License**: No `LICENSE` file exists in the repository — license terms are unspecified.
- **`.env.example`**: No example environment file is provided; the variable list above was reconstructed by scanning all `process.env.*` references in the backend source code.
- **Default ports**: The backend defaults to `PORT=5000` if unset, but the frontend's `axiosInstance.js` assumes the local backend runs on port `8000` — you'll need to explicitly set `PORT=8000` locally (or update the frontend) for local development to work out of the box.
- **CI/CD**: No GitHub Actions or other CI/CD configuration was found in the repository.
- **Testing**: No formal test framework (e.g. Jest, Mocha) is configured. `backend/test_ratio.js` is a standalone manual script (run via `node test_ratio.js`) that validates the Explore feed's 50/25/25 video/Pexels-photo/Unsplash-photo blend ratio — it is not part of an automated test suite.
- **Contribution guidelines**: No `CONTRIBUTING.md` or issue/PR templates were found.