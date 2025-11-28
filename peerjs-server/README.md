# PeerJS Server

Custom PeerJS signaling server for Crazy Remix multiplayer game.

## Deployment

### Option 1: Render (Recommended)
1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Set:
   - **Root Directory**: `peerjs-server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Click "Create Web Service"
6. Copy the deployed URL (e.g., `https://your-app.onrender.com`)

### Option 2: Railway
1. Go to [railway.app](https://railway.app) and sign up
2. Create new project from GitHub repo
3. Set root directory to `peerjs-server`
4. Deploy
5. Copy the deployed URL

## After Deployment
Update `src/logic/network.js` with your server URL:

```javascript
this.peer = new Peer({
    host: 'your-app.onrender.com',  // Your deployed URL
    port: 443,
    path: '/peerjs',
    secure: true,
    // ... rest of config
});
```

## Local Testing
```bash
cd peerjs-server
npm install
npm start
```

Server runs on http://localhost:9000
