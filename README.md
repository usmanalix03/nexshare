# ⚡ NexShare — Dual-Mode Secure File Transfer

NexShare is a premium, open-source file sharing platform featuring a high-contrast dark theme, mobile-first design, and state-of-the-art security features. Built with modern web technologies, it allows you to share files instantly over local networks or securely store them in the cloud with automatic expiry.

## Features

- **📡 Lightning Share (P2P)** 
  - Instant direct device-to-device file transfer via WebRTC.
  - Zero latency, no server upload required.
  - Features an intuitive "LAN Radar" capable of automatically discovering nearby devices, or "Room Codes" for manual joining across different subnets.

- **🔐 Secure Vault (Cloud)**
  - AES-256-CBC encrypted uploads.
  - Creates a unique, shareable link that self-destructs after 24 hours.
  - Securely isolates encryption so keys and files are encrypted exclusively in-memory.

- **📱 User & Mobile-First Experience**
  - Fully responsive, mobile-optimized dark interface inspired by Vercel and Linear.
  - Authentic user management dashboard for uploaded Vault files (requires free login to retain ownership of links).
  - Users can manually delete encrypted links before the 24-hour expiration threshold.

- **⚙️ Automated Janitor Cron Core**
  - Included backend tasks silently monitor PostgreSQL instances.
  - Any encrypted file passing the 24hr TTL limit is automatically unlinked and permanently scrubbed from server volume storage without user intervention.

## Stack & Tech

- **Frontend**: React + Vite, Tailwind v4 + Custom Dark Variables CSS, Framer Motion
- **Backend**: Node.js + Express
- **Database**: CockroachDB (PostgreSQL Protocol)
- **Connections**: Socket.io (Signaling WebRTC interactions), SimplePeer

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/usmanalix03/nexshare.git
   cd nexshare
   ```

2. **Setup the Database:**
   Ensure you have a CockroachDB/PostgreSQL database active. Keep your `DATABASE_URL` ready.

3. **Backend Setup:**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `server` directory and add your keys:
   ```env
   DATABASE_URL=postgresql://user:pass@host:26257/sfs?sslmode=verify-full
   JWT_SECRET=your_32_byte_hex_secret_here
   CLIENT_URL=http://localhost:5173
   ```
   Start the backend server (starts on `http://localhost:3001` usually):
   ```bash
   npm start
   ```

4. **Frontend Setup:**
   Open a new terminal session.
   ```bash
   cd client
   npm install
   ```
   Start the Vite frontend proxy server (starts on `http://localhost:5173` usually):
   ```bash
   npm run dev
   ```

## Usage

- **Local Network File Drops:** Simply navigate to the Lightning Share page on two separate devices on the same Wi-Fi connection. The radar ping will spot the devices, allowing you to instantly beam over any high-size payload peer-to-peer.
- **Async Encrypted Transfer:** Login/register via the Auth page, navigate to Vault, and drag-and-drop your private document. Send the given output link to a peer immediately. Everything deletes magically the next day!

## License
MIT License. Feel free to clone, edit, fork, and use!
