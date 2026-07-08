# Quick Start Guide for Beginners

## 🎯 What This Project Does

This is a **Personal Data Vault** system that:
1. **Collects** your browsing data through a Chrome extension
2. **Analyzes** it with AI to understand your interests
3. **Stores** everything locally on your computer (private!)
4. **Shows** you beautiful analytics and lets you search your data

## 🚀 Step-by-Step Setup (Super Simple!)

### Step 1: Install Node.js
- Go to https://nodejs.org
- Download and install the latest LTS version
- This gives you the tools to run the code

### Step 2: Get the Code
You've already got it! The files are organized in this folder.

### Step 3: Install Backend Dependencies
```bash
cd knowledge-vault-backend
npm install
```

### Step 4: Install Frontend Dependencies
```bash
cd data-vault-frontend
npm install
```

### Step 5: Setup Environment (Optional)
```bash
cd ../knowledge-vault-backend
copy .env.example .env
# Edit .env if you want AI features (get free API key from groq.com)
```

### Step 6: Start the Backend
```bash
cd knowledge-vault-backend
npm start
```
Keep this terminal window open!

### Step 7: Load the Browser Extension
1. Open Chrome browser
2. Go to `chrome://extensions`
3. Turn ON "Developer mode" (top right corner)
4. Click "Load unpacked"
5. Select the `browser-extension` folder
6. You should see the extension icon in your toolbar!

### Step 8: Start the Frontend
Open a new terminal:
```bash
cd data-vault-frontend
npm run dev
```
Open http://localhost:3000 in your browser!

## 🎮 How to Use

1. **Click the extension icon** in Chrome toolbar
2. **Click "Start Session"** to begin collecting data
3. **Browse the web** normally - the extension watches quietly
4. **Go to the web dashboard** at http://localhost:3000 to see your data!

## 🛑 To Stop
- Click the extension icon again
- Click "Stop Session"

## 📁 What Each Folder Does

- `data-vault-frontend/` - Pretty web interface (like a website)
- `knowledge-vault-backend/server/` - Brain of the system (handles requests)
- `knowledge-vault-backend/database/` - Data storage (like a filing cabinet)
- `knowledge-vault-backend/browser-extension/` - Chrome add-on (data collector)
- `knowledge-vault-backend/ai-processing/` - Smart analysis (understands your interests)

## ❓ Having Problems?

**Extension not loading?**
- Make sure you selected the `browser-extension` folder (not a subfolder)
- Check that Developer mode is enabled

**Server not starting?**
- Make sure you ran `npm install` first
- Check that port 4000 isn't being used by another program

**Can't see data?**
- Make sure you started a session in the extension
- Try browsing a few pages and wait a minute

## 🎉 You're Done!

Now you have your own personal data collection system! The data stays on your computer, and you control everything. Perfect for learning about privacy, data, and web development!