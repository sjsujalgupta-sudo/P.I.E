# PIE — Personal Intelligence Engine

This repository contains PIE (Personal Intelligence Engine), a privacy-first personal data vault and intelligence system.

## 🏗️ Project Structure

```
Personal-Data-Vault-Projects/
├── data-vault-frontend/          # Web dashboard (Next.js)
│   ├── src/
│   │   ├── app/                  # Next.js app router pages
│   │   ├── components/           # Reusable UI components
│   │   └── lib/                  # Utilities and API functions
│   └── package.json
│
└── knowledge-vault-backend/      # Data collection system
    ├── server/                   # Main API server (Express.js)
    ├── database/                 # SQLite database management
    ├── ai-processing/            # AI categorization (embeddings)
    ├── browser-extension/        # Chrome extension for data capture
    │   ├── background-scripts/   # Extension background service
    │   ├── content-scripts/      # Page monitoring scripts
    │   └── popup-ui/             # Extension popup interface
    └── web-dashboard/            # Analytics dashboard (HTML/JS)
```

## 🎯 What Each Part Does

### 1. Data Vault Frontend (`data-vault-frontend/`)
**Purpose**: Beautiful web interface for viewing and managing your data
- **Dashboard**: See analytics and recent activity
- **Vault**: Browse all your collected data
- **Deposit**: Review data before sharing with companies
- **Contracts**: Manage data sharing agreements
- **Settings**: Configure privacy preferences

**Tech**: Next.js 14, React, Tailwind CSS, Framer Motion

### 2. Knowledge Vault Backend (`knowledge-vault-backend/`)
**Purpose**: Collects and processes your browsing data

#### Server (`server/`)
- **main-server.js**: Main API server that handles all requests
- Receives data from extension, categorizes it with AI, stores in database

#### Database (`database/`)
- **database-manager.js**: Manages SQLite database
- Stores browsing data, user sessions, settings

#### AI Processing (`ai-processing/`)
- **ai-embeddings-manager.js**: Creates text embeddings for smart search
- Uses local AI models (no data sent to external servers)

#### Browser Extension (`browser-extension/`)
- **extension-manifest.json**: Extension configuration
- **background-scripts/background-service.js**: Coordinates extension activities
- **content-scripts/page-monitor.js**: Monitors web pages for data
- **popup-ui/**: Control panel for starting/stopping data collection

#### Web Dashboard (`web-dashboard/`)
- **analytics-dashboard.html**: Simple analytics viewer
- Shows charts and allows asking questions about your data

## 🚀 Getting Started (For Beginners)

### Prerequisites
- Node.js (v18 or higher)
- Chrome browser (for the extension)
- Basic understanding of terminal commands

### Setup Steps

1. **Install Dependencies**
   ```bash
   # For frontend
   cd data-vault-frontend
   npm install

   # For backend
   cd ../knowledge-vault-backend
   npm install
   ```

2. **Start the Backend Server**
   ```bash
   cd knowledge-vault-backend
   npm start
   ```
   This starts the API server on http://localhost:4000

3. **Load the Browser Extension**
   - Open Chrome and go to `chrome://extensions`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `browser-extension` folder
   - The extension icon should appear in your toolbar

4. **Start the Frontend**
   ```bash
   cd data-vault-frontend
   npm run dev
   ```
   Open http://localhost:3000 in your browser

## 📖 How It Works

1. **Data Collection**: The browser extension monitors your browsing and sends data to the backend
2. **AI Processing**: The server uses AI to categorize your interests, topics, and tools
3. **Storage**: Everything is stored locally in a SQLite database on your computer
4. **Viewing**: Use the web dashboard to see analytics and search your data
5. **Privacy**: Your data never leaves your computer unless you explicitly choose to share it

## 🔒 Privacy & Security

- All data stays on your local machine
- No tracking or data collection without your explicit consent
- You control what data is collected and how it's used
- AI processing happens locally (no external API calls for core features)

## 🛠️ Development

Each folder has its own purpose and can be developed independently:

- **Frontend**: Modern React development with hot reloading
- **Backend**: Express.js API with SQLite database
- **Extension**: Chrome extension development
- **AI**: Local machine learning for text analysis

## 📚 Learning Resources

- **Frontend**: Learn React, Next.js, and modern web development
- **Backend**: Learn Node.js, Express, and REST APIs
- **Database**: Learn SQL and database design
- **AI**: Learn about embeddings and natural language processing
- **Extensions**: Learn Chrome extension development

This project is perfect for beginners who want to learn full-stack development while building something meaningful about privacy and data ownership!