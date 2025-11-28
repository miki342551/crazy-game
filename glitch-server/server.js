const express = require('express');
const { ExpressPeerServer } = require('peer');
const cors = require('cors');

const app = express();

// Enable CORS for all origins (allows cross-network play)
app.use(cors());

const server = app.listen(process.env.PORT || 3000);

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/',
});

app.use('/peerjs', peerServer);

app.get('/', (req, res) => {
    res.send('PeerJS Server Running');
});

console.log('Server started on port', process.env.PORT || 3000);
