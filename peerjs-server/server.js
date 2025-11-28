const express = require('express');
const { ExpressPeerServer } = require('peer');
const cors = require('cors');

const app = express();

// Enable CORS for your domains
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:4173',
        'https://crazy-game-8nw4kcc2v-miki342551s-projects.vercel.app',
        'https://crazygame12.netlify.app',
        'https://miki342551.github.io'
    ],
    credentials: true
}));

const port = process.env.PORT || 9000;

const server = app.listen(port, () => {
    console.log(`✅ PeerJS server running on port ${port}`);
});

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/',
    alive_timeout: 60000,
    allow_discovery: true
});

app.use('/peerjs', peerServer);

// Health check endpoint
app.get('/', (req, res) => {
    res.send('PeerJS Server is running!');
});

peerServer.on('connection', (client) => {
    console.log('Client connected:', client.getId());
});

peerServer.on('disconnect', (client) => {
    console.log('Client disconnected:', client.getId());
});
