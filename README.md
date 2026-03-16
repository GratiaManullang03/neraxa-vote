# Neraxa Vote

A design voting system for the Neraxa finance tracker. Users can vote for their preferred design style and leave optional feedback notes.

## Features

- **7 Design Styles**: Neo-Brutalism, Glassmorphism, Neumorphism, Claymorphism, Cyberpunk UI, Material Design 3, and Minimalism
- **Interactive Demos**: Each design card has a "Try it" button to explore the interactive preview
- **Optional Notes**: Users can leave feedback notes with their vote (max 500 characters)
- **Real-time Results**: Admin panel shows live voting results
- **Redis Integration**: Upstash Redis for persistent storage across sessions
- **LocalStorage Fallback**: Works without Redis for local testing

## Deployment on Vercel

### Option 1: Deploy via GitHub (Recommended)

1. **Push to GitHub**

    ```bash
    git add .
    git commit -m "Initial commit"
    git push origin main
    ```

2. **Connect to Vercel**
    - Go to [vercel.com](https://vercel.com)
    - Import your GitHub repository
    - Click Deploy

3. **Redis credentials are already configured** in the code.

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Routes

- **Voting Page**: `https://your-domain.com/` (index.html)
- **Admin Panel**: `https://your-domain.com/admin` (admin.html)

## Local Development

### Without Redis (LocalStorage only)

Just open `index.html` in your browser. Votes and notes will be stored locally.

### With Redis (for testing)

1. Edit `script.js` and `admin.html` with your Upstash credentials
2. Or run: `node build.js` (reads from `.env` file)

## File Structure

```
neraxa-vote/
├── index.html          # Main voting page
├── admin.html          # Admin results dashboard
├── style.css           # All styles
├── script.js           # Voting logic & Redis integration
├── favicon.png         # Site favicon
├── vercel.json         # Vercel configuration
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

## Voting Flow

1. User selects a design style
2. Clicks "Cast My Vote"
3. Optionally enters feedback notes
4. Clicks "Submit Vote"
5. Vote is saved to Redis + localStorage
6. Results are displayed

## License

Private - For Neraxa team use only.
