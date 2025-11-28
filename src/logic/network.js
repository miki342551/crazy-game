import { supabase } from '../lib/supabase';

export class NetworkManager {
    constructor() {
        this.roomCode = null;
        this.roomId = null;
        this.channel = null;
        this.isHost = false;
        this.callbacks = {
            onData: () => { },
            onPeerConnect: () => { },
            onPeerDisconnect: () => { },
            onConnectedToHost: () => { },
        };
    }

    // Generate a random 6-character room code
    generateRoomCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // Host a game
    async hostGame(onReady) {
        this.isHost = true;
        this.roomCode = this.generateRoomCode();

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
            alert('Failed to create game room. Please try again.');
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

                    // Handle Handshake: Guest asks for state, Host sends it
                    if (this.isHost && msg.type === 'JOIN_REQUEST') {
                        console.log('Guest requested join. Sending full state...');
                        if (this.callbacks.onPeerConnect) this.callbacks.onPeerConnect('Guest');
                        // We rely on App.jsx to trigger the state broadcast after onPeerConnect
                        // But we can also force a sync if we have the latest state stored locally?
                        // App.jsx will see onPeerConnect and likely broadcast.
                        return;
                    }

                    // Handle Handshake: Guest receives state
                    if (!this.isHost && msg.type === 'STATE_UPDATE') {
                        // If we were waiting for connection, this confirms it
                        if (this.callbacks.onConnectedToHost) {
                            this.callbacks.onConnectedToHost();
                            // Clear callback so we don't trigger it again
                            this.callbacks.onConnectedToHost = null;
                        }
                    }

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
                        this.sendBroadcast({ type: 'JOIN_REQUEST' });
                    }
                }
            });
    }

    // Broadcast game state (Fast Ephemeral Mode)
    async broadcast(data) {
        if (!this.roomCode || !this.channel) return;
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
