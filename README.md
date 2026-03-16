# Neraxa Vote

A design voting system for the Neraxa finance tracker. Users can vote for their preferred design style and leave optional feedback notes.

## Features

- **7 Design Styles**: Neo-Brutalism, Glassmorphism, Neumorphism, Claymorphism, Cyberpunk UI, Material Design 3, and Minimalism
- **Interactive Demos**: Each design card has a "Try it" button to explore the interactive preview
- **Optional Notes**: Users can leave feedback notes with their vote
- **Real-time Results**: Admin panel shows live voting results
- **Redis Integration**: Optional Upstash Redis for persistent storage across sessions
- **LocalStorage Fallback**: Works without Redis for local testing

## Deployment on Vercel

### 1. Set Environment Variables in Vercel

Before deploying, go to your Vercel project dashboard:

- **Settings → Environment Variables**
- Add these variables:

```
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

Get these values from your [Upstash Console](https://console.upstash.com).

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (environment variables will be injected during build)
vercel
```

Or connect your GitHub repository to Vercel at [vercel.com](https://vercel.com)

### 3. Routes

- **Voting Page**: `https://your-domain.com/` (index.html)
- **Admin Panel**: `https://your-domain.com/admin` (admin.html)

## Local Development

### Without Redis (LocalStorage only)

Just open `index.html` in your browser. Votes and notes will be stored locally.

### With Redis (for testing)

1. Copy `.env.example` to `.env.local` and add your credentials
2. Manually edit `script.js` and `admin.html` to replace the `__UPSTASH_*__` placeholders with your actual values
3. Or run the build script with environment variables:
    ```bash
    UPSTASH_REDIS_REST_URL=your_url UPSTASH_REDIS_REST_TOKEN=your_token node build.js
    ```

## File Structure

```
neraxa-vote/
├── index.html          # Main voting page
├── admin.html          # Admin results dashboard
├── style.css           # All styles
├── script.js           # Voting logic & Redis integration
├── favicon.png         # Site favicon
├── vercel.json         # Vercel configuration (rewrites, build)
├── build.js            # Build script to inject env variables
├── .env.example        # Environment variables template
├── .gitignore
├── .gitattributes
├── .vercelignore
└── README.md
```

## Redis Data Structure

- `neraxa:votes` - Hash storing vote counts per design
- `neraxa:notes` - Hash storing feedback notes with timestamps

## Admin Panel Features

- Total votes count
- Vote breakdown by design style with distribution bars
- Rankings with medals (🥇🥈🥉)
- All submitted feedback notes with timestamps
- Manual refresh button

## License

Private - For Neraxa team use only.
