# PixelMuse Retention Prototype

This repo contains a working prototype called **Weekly Pose League** to solve PixelMuse's Novelty Cliff.

## Core retention loop
- Daily challenge changes automatically by day of week.
- Pose Coach gives practical posing and camera guidance.
- User generates an image for the challenge and locks a daily check-in.
- Streak, level, and weekly goal progress reward repeat behavior.
- Remix Reel shows community + personal outputs so users return to see what's new.

## Tech stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Image output: Seed-based generated image URLs for demo reliability
- Puter.js script is included in the client HTML for future AI image API replacement

## Run locally
### 1) Start API
- In one terminal:
  - `cd server`
  - `npm install`
  - `npm run dev`

### 2) Start frontend
- In second terminal:
  - `cd client`
  - `npm install`
  - `npm run dev`

Open the Vite URL and use the app.

## Demo flow (90 seconds)
1. Show today's challenge, streak, and 3-checkin weekly goal.
2. Generate an image from prompt + pose guidance.
3. Lock daily check-in and show streak increase.
4. Open Remix Reel to show social continuity.
5. Press Demo: Jump to next day and show fresh challenge.

## Primary experiment metric
- Primary: Day-7 retention
- Baseline: 11%
- Target: 26% in target segment within first growth test
