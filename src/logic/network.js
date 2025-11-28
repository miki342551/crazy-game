import Peer from 'peerjs';

export class NetworkManager {
    constructor() {
        this.peer = null;
        this.connections = []; // List of connections (for Host)
        this.hostConn = null;  // Connection to Host (for Peer)
        this.myId = null;
        this.isHost = false;
        this.callbacks = {
            onData: () => { },
            onPeerConnect: () => { }, // When a peer connects to us
            onPeerDisconnect: () => { },
            onConnectedToHost: () => { }, // When we connect to host
        };
    }

    // Initialize Peer
    initialize(onId) {
        // Let PeerJS choose the best available server automatically
        this.peer = new Peer({
            debug: 3, // Maximum debug level
            config: {
                iceServers: [
                    // Multiple STUN servers for redundancy
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' },
                    // OpenRelay TURN servers (free, reliable)
                    {
                        urls: 'turn:openrelay.metered.ca:80',
                        username: 'openrelayproject',
                        credential: 'openrelayproject'
                    },
                    {
                        urls: 'turn:openrelay.metered.ca:443',
                        username: 'openrelayproject',
                        credential: 'openrelayproject'
                    },
                    {
                        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                        username: 'openrelayproject',
                        credential: 'openrelayproject'
                    }
                ],
                iceTransportPolicy: 'all', // Try all connection methods
                iceCandidatePoolSize: 10 // Pre-gather candidates
            }
        });

        this.peer.on('open', (id) => {
            this.myId = id;
            console.log('✅ Connected to PeerJS server. My ID:', id);
            if (onId) onId(id);
        });

        this.peer.on('connection', (conn) => {
            console.log('📞 Incoming connection from:', conn.peer);
            this.handleIncomingConnection(conn);
        });

        this.peer.on('error', (err) => {
            console.error('❌ PeerJS Error:', err);
        });
    }

    // Host a game
    hostGame(onReady) {
        this.isHost = true;
        this.initialize(onReady);
    }

    // Join a game with retry logic
    joinGame(hostId, onConnected) {
        this.isHost = false;
        this.initialize(() => {
            console.log('🔗 Attempting to connect to host:', hostId);

            let retryCount = 0;
            const maxRetries = 3;

            const connectWithRetry = () => {
                const conn = this.peer.connect(hostId, {
                    reliable: true
                });

                // Set a timeout for connection
                const connectionTimeout = setTimeout(() => {
                    if (!conn.open) {
                        console.warn(`⚠️ Connection attempt ${retryCount + 1} timed out.`);
                        conn.close();

                        if (retryCount < maxRetries) {
                            retryCount++;
                            console.log(`🔄 Retrying connection (${retryCount}/${maxRetries})...`);
                            setTimeout(connectWithRetry, 1000);
                        } else {
                            console.error('❌ Connection timeout - could not reach host after retries');
                            alert('Connection failed: Could not reach host.\n\nPossible reasons:\n- Host ID is incorrect\n- Host is offline\n- Network/firewall blocking connection\n\nTry refreshing and hosting again.');
                        }
                    }
                }, 10000); // 10 second timeout per attempt

                conn.on('open', () => {
                    clearTimeout(connectionTimeout);
                    console.log('✅ Successfully connected to host!');
                });

                conn.on('error', (err) => {
                    console.error('Connection error during attempt:', err);
                    clearTimeout(connectionTimeout);
                    if (retryCount < maxRetries) {
                        retryCount++;
                        setTimeout(connectWithRetry, 1000);
                    }
                });

                this.handleOutgoingConnection(conn, onConnected);
            };

            connectWithRetry();
        });
    }

    // Handle someone connecting to us (Host logic)
    handleIncomingConnection(conn) {
        conn.on('open', () => {
            console.log('Connection opened with peer:', conn.peer);
            this.connections.push(conn);
            if (this.callbacks.onPeerConnect) this.callbacks.onPeerConnect(conn.peer);
        });

        conn.on('data', (data) => {
            console.log('Received data from peer:', data);
            if (this.callbacks.onData) this.callbacks.onData(data, conn.peer);
        });

        conn.on('close', () => {
            console.log('Peer disconnected:', conn.peer);
            this.connections = this.connections.filter(c => c.peer !== conn.peer);
            if (this.callbacks.onPeerDisconnect) this.callbacks.onPeerDisconnect(conn.peer);
        });

        conn.on('error', (err) => {
            console.error('Connection error:', err);
        });
    }

    // Handle us connecting to someone (Peer logic)
    handleOutgoingConnection(conn, onConnected) {
        this.hostConn = conn;

        conn.on('open', () => {
            console.log('✅ Connected to Host');
            if (onConnected) onConnected();
            if (this.callbacks.onConnectedToHost) this.callbacks.onConnectedToHost();
        });

        conn.on('data', (data) => {
            console.log('📨 Received data from Host');
            if (this.callbacks.onData) this.callbacks.onData(data, 'HOST');
        });

        conn.on('close', () => {
            console.warn('⚠️ Disconnected from Host');
        });

        conn.on('error', (err) => {
            console.error('❌ Connection error:', err);
        });
    }

    // Send data
    broadcast(data) {
        console.log('Broadcasting:', data.type);
        if (this.isHost) {
            this.connections.forEach(conn => {
                if (conn.open) {
                    conn.send(data);
                } else {
                    console.warn('Connection not open for peer:', conn.peer);
                }
            });
        } else {
            if (this.hostConn && this.hostConn.open) {
                this.hostConn.send(data);
            } else {
                console.warn('Host connection not open');
            }
        }
    }

    // Register callbacks
    on(event, callback) {
        this.callbacks[event] = callback;
    }
}
