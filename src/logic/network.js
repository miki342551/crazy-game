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
            // Create room in database
            const { data, error } = await supabase
                .from('game_rooms')
                .insert([
                    {
                        room_code: this.roomCode,
                        game_state: {}
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

    // Subscribe to room updates
    subscribeToRoom() {
        this.channel = supabase
            .channel(`room:${this.roomCode}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'game_rooms',
                    filter: `room_code=eq.${this.roomCode}`
                },
                (payload) => {
                    console.log('📨 Received update:', payload.new.game_state);
                    if (this.callbacks.onData) {
                        this.callbacks.onData(payload.new.game_state, 'NETWORK');
                    }
                }
            )
            .subscribe((status) => {
                console.log('Subscription status:', status);
            });
    }

    // Broadcast game state
    async broadcast(data) {
        if (!this.roomCode) return;

        try {
            const { error } = await supabase
                .from('game_rooms')
                .update({
                    game_state: data,
                    updated_at: new Date().toISOString()
                })
                .eq('room_code', this.roomCode);

            if (error) throw error;
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
