import { supabase } from '../lib/supabase';

export class NetworkManager {
    constructor() {
        this.roomCode = null;
        this.roomId = null;
        this.channel = null;
        this.isHost = false;
        this.myPlayerId = null; // Assigned by host
        this.connectedPlayers = []; // List of player names in the lobby
        this.callbacks = {
            onData: () => { },
            onPeerConnect: () => { },
            onPeerDisconnect: () => { },
            onConnectedToHost: () => { },
            onPlayerListUpdate: () => { }, // New callback for lobby updates
        };
    }

    // Generate a random 6-character room code
    generateRoomCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // Host a game
    async hostGame(onReady) {
        this.isHost = true;
        this.myPlayerId = 0; // Host is always player 0
        this.roomCode = this.generateRoomCode();
        this.connectedPlayers = ['Host']; // Host is the first player

        try {
            // Create room in database with WAITING status
            const { data, error } = await supabase
                .from('game_rooms')
                .insert([
                    {
                        room_code: this.roomCode,
                        game_state: { status: 'WAITING' }
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            this.roomId = data.id;
            console.log('✅ Room created:', this.roomCode);

            // Subscribe to room updates
            this.subscribeToRoom();

            if (onReady) onReady(this.roomCode);
        } catch (error) {
            console.error('❌ Error creating room:', error);
            alert(`Failed to create game room: ${error.message || error.details || 'Unknown error'}`);
        }
    }

    // Join a game
    async joinGame(roomCode, onConnected) {
        this.isHost = false;
        this.roomCode = roomCode.toUpperCase();

        try {
            // Check if room exists
            const { data, error } = await supabase
                .from('game_rooms')
                .select('*')
                .eq('room_code', this.roomCode)
                .single();

            if (error || !data) {
                throw new Error('Room not found');
            }

            this.roomId = data.id;
            console.log('✅ Found room:', this.roomCode);

            // Subscribe to room updates
            this.subscribeToRoom();

            // If there's an existing state in the DB, load it immediately
            if (data.game_state && Object.keys(data.game_state).length > 0) {
                console.log('📦 Loading initial state from DB...');
                if (this.callbacks.onData) {
                    this.callbacks.onData({
                        type: 'STATE_UPDATE',
                        state: data.game_state
                    }, 'NETWORK');
                }
            }

            if (onConnected) onConnected();
            if (this.callbacks.onConnectedToHost) this.callbacks.onConnectedToHost();
        } catch (error) {
            console.error('❌ Error joining room:', error);
            alert('Failed to join game. Check the room code and try again.');
        }
    }

    // Subscribe to room updates (Broadcast Mode)
    subscribeToRoom() {
        this.channel = supabase
            .channel(`room:${this.roomCode}`, {
                config: {
                    broadcast: { self: false } // Don't receive our own messages
                }
            })
            .on(
                'broadcast',
                { event: 'game_message' },
                (payload) => {
                    const msg = payload.payload;
                    console.log('⚡ Received broadcast:', msg.type);

                    // --- HOST LOGIC ---
                    if (this.isHost) {
                        if (msg.type === 'JOIN_REQUEST') {
                            // A new player wants to join
                            const guestName = msg.playerName || `Player ${this.connectedPlayers.length + 1}`;

                            // Check for max players (4)
                            if (this.connectedPlayers.length >= 4) {
                                console.log('Room is full, ignoring join request.');
                                return;
                            }

                            const newPlayerId = this.connectedPlayers.length;
                            this.connectedPlayers.push(guestName);
                            console.log(`Player ${guestName} joined with ID ${newPlayerId}`);

                            // Broadcast the updated player list to everyone
                            this.sendBroadcast({
                                type: 'PLAYER_LIST_UPDATE',
                                players: this.connectedPlayers,
                                newPlayerId: newPlayerId,
                                newPlayerName: guestName
                            });

                            if (this.callbacks.onPlayerListUpdate) {
                                this.callbacks.onPlayerListUpdate(this.connectedPlayers);
                            }
                            if (this.callbacks.onPeerConnect) {
                                this.callbacks.onPeerConnect(guestName);
                            }
                            return;
                        }
                    }

                    // --- GUEST LOGIC ---
                    if (!this.isHost) {
                        if (msg.type === 'PLAYER_LIST_UPDATE') {
                            this.connectedPlayers = msg.players;
                            // If we just joined, find our ID
                            if (this.myPlayerId === null && msg.newPlayerName) {
                                // Check if the new player is us (simple heuristic: we requested last)
                                this.myPlayerId = msg.newPlayerId;
                                console.log(`Assigned player ID: ${this.myPlayerId}`);
                            }
                            if (this.callbacks.onPlayerListUpdate) {
                                this.callbacks.onPlayerListUpdate(this.connectedPlayers);
                            }
                            return;
                        }
                        if (msg.type === 'STATE_UPDATE') {
                            // Game state sync during gameplay
                            if (this.callbacks.onConnectedToHost) {
                                this.callbacks.onConnectedToHost();
                                this.callbacks.onConnectedToHost = null;
                            }
                        }
                    }

                    // --- COMMON: Pass to App.jsx for game logic ---
                    if (this.callbacks.onData) {
                        this.callbacks.onData(msg, 'NETWORK');
                    }
                }
            )
            .subscribe((status) => {
                console.log('Subscription status:', status);
                if (status === 'SUBSCRIBED') {
                    // If we are joining, ask for state
                    if (!this.isHost) {
                        this.sendBroadcast({ type: 'JOIN_REQUEST', playerName: `Player ${Date.now() % 1000}` });
                    }
                }
            });
    }

    // Broadcast game state (Fast Ephemeral Mode + DB Persistence)
    async broadcast(data) {
        if (!this.roomCode || !this.channel) return;

        // --- DB PERSISTENCE (Host Only) ---
        // Save state to database for robustness and potential reconnection
        if (this.isHost && (data.type === 'STATE_UPDATE' || data.type === 'GAME_START')) {
            try {
                const { error } = await supabase
                    .from('game_rooms')
                    .update({
                        game_state: data.state,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', this.roomId);

                if (error) console.error('❌ Error saving state to DB:', error);
            } catch (err) {
                console.error('❌ DB Update failed:', err);
            }
        }

        this.sendBroadcast(data);
    }

    async sendBroadcast(msg) {
        try {
            await this.channel.send({
                type: 'broadcast',
                event: 'game_message',
                payload: msg
            });
        } catch (error) {
            console.error('❌ Error broadcasting:', error);
        }
    }

    // Register callbacks
    on(event, callback) {
        this.callbacks[event] = callback;
    }

    // Cleanup
    disconnect() {
        if (this.channel) {
            this.channel.unsubscribe();
        }
    }
}
