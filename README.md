# ChatReader

Read your WhatsApp exports privately. No servers. No accounts. No tracking.

Your chat is encrypted with AES-256-GCM directly in the browser, stored locally in IndexedDB, and never leaves your device.

## Features

- Upload `.txt` or `.zip` WhatsApp exports
- AES-256-GCM encryption with a password you set
- Media support — images, video, audio, documents
- Search and filter messages by sender
- Light / dark mode
- Zero network requests after page load

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```
   npm install
   ```
2. Start the dev server:
   ```
   npm run dev
   ```

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Web Crypto API (AES-256-GCM)
- IndexedDB via `idb`
- `react-virtuoso` for virtualized message rendering
