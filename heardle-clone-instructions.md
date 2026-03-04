# Heardle Clone - Local Music Guessing Game

## Project Overview
Create a locally hosted Heardle-style music guessing game that uses local audio files organized by artist and album to create on-demand puzzles. The application should be fully configurable and run entirely offline.

## Architecture Overview

### Backend (Node.js + Express)

**Components:**

1. **Web Server**
   - Express.js server to serve frontend and API endpoints
   - RESTful API for game logic and audio streaming
   - CORS enabled for local development

2. **Audio Streaming Service**
   - Serve audio snippets with precise time controls
   - Support HTTP range requests for efficient streaming
   - On-the-fly audio trimming to serve specific time segments
   - Apply fade-in/fade-out effects to snippets

3. **File Scanner & Indexer**
   - Recursive directory scanner to index audio files
   - Read ID3 tags (artist, album, title, duration) using music-metadata library
   - Fall back to folder structure if metadata unavailable
   - Build in-memory database of all songs
   - Support multiple audio formats: MP3, FLAC, M4A, WAV

4. **Game Logic Engine**
   - Random song selection with optional filters (artist, album, decade)
   - Daily puzzle mode using date-based seeding for deterministic randomness
   - Practice mode with unlimited random puzzles
   - Track game state per session
   - Validate guesses against song metadata
   - Calculate and return statistics

5. **Configuration Manager**
   - Load settings from config.json or config.yaml
   - Hot-reload configuration changes
   - Validate configuration on startup

### Frontend (React + Tailwind CSS)

**Components:**

1. **Responsive UI Layout**
   - Mobile-first design
   - Touch-friendly controls
   - Progressive Web App (PWA) support for mobile devices
   - Dark/light theme support

2. **Audio Player Component**
   - HTML5 audio or Howler.js for robust playback
   - Custom controls for progressive snippet playback
   - Visual waveform or progress indicator
   - Mute/volume controls

3. **Game Interface**
   - Attempt counter showing current attempt / max attempts
   - Skip button to reveal more audio
   - Submit button to make a guess
   - Autocomplete search field for song/artist selection
   - Virtual keyboard friendly input
   - Visual feedback for correct/incorrect guesses

4. **Autocomplete Search**
   - Real-time filtering of song library
   - Display artist + song title
   - Keyboard navigation support
   - Fuzzy matching for typos

5. **Results Screen**
   - Show correct answer
   - Display attempt number or skips used
   - Play full song option
   - Statistics summary
   - Share functionality (text-based, no external dependencies)
   - Play again / next puzzle button

6. **Statistics Dashboard**
   - Games played
   - Win percentage
   - Guess distribution histogram
   - Current/max streak tracking
   - Stored in browser localStorage

7. **Settings/Configuration UI**
   - Adjust snippet durations
   - Toggle daily vs practice mode
   - Filter library by artist/album/genre
   - Audio quality settings
   - Reset statistics

### Configuration File Structure

**config.json:**
```json
{
  "server": {
    "port": 3000,
    "host": "localhost"
  },
  "audio": {
    "libraryPath": "/path/to/music/library",
    "supportedFormats": ["mp3", "flac", "m4a", "wav"],
    "organizationStructure": "artist/album",
    "fadeIn": 0.5,
    "fadeOut": 0.5
  },
  "game": {
    "snippetDurations": [1, 2, 4, 7, 11, 16],
    "maxAttempts": 6,
    "dailyPuzzle": true,
    "allowSkips": true
  },
  "filters": {
    "enableArtistFilter": true,
    "enableAlbumFilter": true,
    "enableGenreFilter": true,
    "enableDecadeFilter": true
  }
}
```

**config.yaml (alternative):**
```yaml
server:
  port: 3000
  host: localhost

audio:
  libraryPath: /path/to/music/library
  supportedFormats:
    - mp3
    - flac
    - m4a
    - wav
  organizationStructure: artist/album
  fadeIn: 0.5
  fadeOut: 0.5

game:
  snippetDurations: [1, 2, 4, 7, 11, 16]
  maxAttempts: 6
  dailyPuzzle: true
  allowSkips: true

filters:
  enableArtistFilter: true
  enableAlbumFilter: true
  enableGenreFilter: true
  enableDecadeFilter: true
```

## Data Structures

### Song Index (In-Memory Database)
```javascript
{
  id: "unique-hash",
  artist: "Artist Name",
  album: "Album Name",
  title: "Song Title",
  filePath: "/absolute/path/to/file.mp3",
  duration: 245.6, // seconds
  year: 2020,
  genre: "Rock",
  track: 3
}
```

### Game Session State
```javascript
{
  sessionId: "uuid",
  songId: "unique-hash",
  attempts: 2,
  maxAttempts: 6,
  guesses: ["Wrong Artist - Song", "Another Wrong"],
  currentSnippetIndex: 1,
  startTime: "2026-02-05T10:30:00Z",
  completed: false,
  won: false
}
```

### User Statistics (localStorage)
```javascript
{
  gamesPlayed: 45,
  gamesWon: 32,
  currentStreak: 5,
  maxStreak: 12,
  guessDistribution: {
    1: 8,
    2: 12,
    3: 7,
    4: 3,
    5: 2,
    6: 0,
    fail: 13
  },
  lastPlayed: "2026-02-05"
}
```

## API Endpoints

### Game Management
- `GET /api/game/daily` - Get or create today's daily puzzle
- `GET /api/game/practice` - Create new practice game
- `POST /api/game/:sessionId/guess` - Submit a guess
- `POST /api/game/:sessionId/skip` - Skip to next snippet
- `GET /api/game/:sessionId/reveal` - Reveal answer (end game)
- `GET /api/game/:sessionId/state` - Get current game state

### Audio Streaming
- `GET /api/audio/:sessionId/snippet/:index` - Stream audio snippet for current attempt
- `GET /api/audio/:songId/full` - Stream full song (after reveal)

### Library & Search
- `GET /api/library/songs` - Get all songs with optional filters
- `GET /api/library/search?q=query` - Search songs for autocomplete
- `GET /api/library/artists` - Get all artists
- `GET /api/library/albums` - Get all albums

### Configuration
- `GET /api/config` - Get current configuration
- `POST /api/config` - Update configuration (optional admin feature)

## Key Features

### Core Gameplay
1. **Progressive Audio Reveal**: Start with 1 second, increase with each attempt
2. **Smart Guessing**: Autocomplete from indexed library
3. **Skip Mechanism**: Allow skipping to next snippet without guessing
4. **Instant Feedback**: Visual confirmation of correct/incorrect guesses

### Game Modes
1. **Daily Puzzle**: One puzzle per day, same for all "players" (date-seeded)
2. **Practice Mode**: Unlimited random puzzles
3. **Filtered Mode**: Play only songs from specific artist/album/genre

### User Experience
1. **Mobile Responsive**: Works on phones, tablets, desktops
2. **Offline First**: No internet required after initial load
3. **Fast Loading**: In-memory database, efficient streaming
4. **Accessibility**: Keyboard navigation, screen reader support

### Statistics & Persistence
1. **Local Storage**: All stats saved in browser
2. **Streak Tracking**: Current and max streaks
3. **Guess Distribution**: Visual histogram of performance
4. **Shareable Results**: Copy text summary to clipboard

## Technology Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Audio Processing**: 
  - `music-metadata` - Read ID3 tags
  - `fluent-ffmpeg` - Audio manipulation (optional)
- **File System**: Node.js `fs` module with promises
- **Configuration**: `dotenv`, `js-yaml`, or `config` package
- **Utilities**: `uuid`, `date-fns`

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Audio**: Howler.js or native HTML5 Audio
- **State Management**: React Context API or Zustand
- **HTTP Client**: Fetch API or Axios
- **Icons**: Lucide React or Heroicons
- **Animations**: Framer Motion (optional)

### Development Tools
- **Package Manager**: npm or pnpm
- **Linting**: ESLint
- **Formatting**: Prettier
- **TypeScript**: Optional but recommended

## Project Structure

```
heardle-clone/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── config.js
│   │   ├── services/
│   │   │   ├── audioService.js
│   │   │   ├── libraryService.js
│   │   │   └── gameService.js
│   │   ├── routes/
│   │   │   ├── gameRoutes.js
│   │   │   ├── audioRoutes.js
│   │   │   └── libraryRoutes.js
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   └── server.js
│   ├── package.json
│   └── config.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AudioPlayer.jsx
│   │   │   ├── GameBoard.jsx
│   │   │   ├── SearchInput.jsx
│   │   │   ├── ResultsModal.jsx
│   │   │   └── Statistics.jsx
│   │   ├── hooks/
│   │   │   ├── useGame.js
│   │   │   └── useAudio.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── localStorage.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── README.md
└── .gitignore
```

## Implementation Steps

1. **Backend Setup**
   - Initialize Node.js project
   - Set up Express server
   - Implement configuration loader
   - Create library scanner and indexer
   - Build audio streaming service
   - Implement game logic and session management
   - Create API routes

2. **Frontend Setup**
   - Initialize React + Vite project
   - Set up Tailwind CSS
   - Create component structure
   - Implement audio player
   - Build game interface
   - Add autocomplete search
   - Create results and statistics views
   - Implement localStorage persistence

3. **Integration**
   - Connect frontend to backend API
   - Test audio streaming
   - Verify game flow
   - Test on mobile devices

4. **Polish**
   - Add loading states
   - Error handling
   - Animations and transitions
   - Accessibility improvements
   - Performance optimization

## Deployment

Run locally:
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Access at `http://localhost:3000`

For production build:
1. Build frontend: `cd frontend && npm run build`
2. Serve static files from backend
3. Single server on one port

## Future Enhancements

- Multiplayer mode (local network)
- Custom playlists
- Difficulty levels (adjust snippet lengths)
- Leaderboards (optional database)
- Song skipping in library
- Album art display
- Audio visualization
- Export/import statistics
- Multiple language support
