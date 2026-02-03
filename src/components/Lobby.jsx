import React, { useState } from 'react';

function Lobby({ onHost, onJoin, onStartGame, players, isHost }) {
    const [joinId, setJoinId] = useState('');
    const [isHosting, setIsHosting] = useState(false);
    const [hostId, setHostId] = useState(null);
    const [status, setStatus] = useState('');

    const handleHost = () => {
        setIsHosting(true);
        setStatus('Initializing Host...');
        onHost((id) => {
            setHostId(id);
            setStatus('Waiting for players...');
        });
    };

    const handleJoin = () => {
        if (!joinId) return;
        setStatus('Connecting to host...');
        onJoin(joinId);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(hostId);
        alert('ID copied to clipboard!');
    };

    const canStartGame = isHost && players && players.length >= 2;

    return (
        <div className="lobby-container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: '20px',
            color: 'white'
        }}>
            <h1>Crazy Remix Multiplayer</h1>

            {!isHosting && !status.includes('Connecting') && (
                <div className="lobby-actions" style={{ display: 'flex', gap: '20px' }}>
                    <div className="host-section">
                        <button onClick={handleHost} style={{ padding: '15px 30px', fontSize: '1.2rem' }}>
                            Host Game
                        </button>
                    </div>
                    <div className="join-section" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="Enter Host ID"
                            value={joinId}
                            onChange={(e) => setJoinId(e.target.value)}
                            style={{ padding: '10px' }}
                        />
                        <button onClick={handleJoin} disabled={!joinId} style={{ padding: '10px' }}>
                            Join Game
                        </button>
                    </div>
                </div>
            )}

            {isHosting && hostId && (
                <div className="host-info" style={{ textAlign: 'center' }}>
                    <h3>Share this ID with your friends:</h3>
                    <div style={{
                        background: 'rgba(0,0,0,0.5)',
                        padding: '15px',
                        borderRadius: '8px',
                        marginBottom: '10px',
                        fontFamily: 'monospace',
                        fontSize: '1.5rem'
                    }}>
                        {hostId}
                    </div>
                    <button onClick={copyToClipboard}>Copy ID</button>
                    <p>{status}</p>
                </div>
            )}

            {/* Player List */}
            {players && players.length > 0 && (
                <div className="player-list" style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '20px',
                    borderRadius: '12px',
                    minWidth: '250px',
                    textAlign: 'center'
                }}>
                    <h3>Players in Lobby ({players.length}/4)</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0' }}>
                        {players.map((name, i) => (
                            <li key={i} style={{
                                padding: '8px',
                                background: i === 0 ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255,255,255,0.05)',
                                borderRadius: '6px',
                                marginBottom: '5px'
                            }}>
                                {name} {i === 0 && '(Host)'}
                            </li>
                        ))}
                    </ul>

                    {isHost && (
                        <button
                            onClick={onStartGame}
                            disabled={!canStartGame}
                            style={{
                                padding: '12px 24px',
                                fontSize: '1.1rem',
                                marginTop: '10px',
                                background: canStartGame ? '#4CAF50' : '#555',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: canStartGame ? 'pointer' : 'not-allowed'
                            }}
                        >
                            Start Game
                        </button>
                    )}
                    {!isHost && (
                        <p style={{ color: '#aaa', marginTop: '10px' }}>Waiting for Host to start...</p>
                    )}
                </div>
            )}

            {status && !players?.length && <p>{status}</p>}

            <div className="troubleshoot-info" style={{ marginTop: '20px', fontSize: '0.9rem', color: '#aaa', maxWidth: '400px', textAlign: 'center' }}>
                <p><strong>Trouble connecting?</strong></p>
                <ul style={{ textAlign: 'left', paddingLeft: '20px' }}>
                    <li>If playing on <strong>different Wi-Fi</strong> networks, ensure the game is deployed (e.g. Vercel) or tunneled (ngrok). Localhost won't work!</li>
                    <li>If on <strong>same Wi-Fi</strong>, use the host's IP address instead of localhost.</li>
                    <li>Some corporate/school networks block P2P connections.</li>
                </ul>
            </div>
        </div>
    );
}

export default Lobby;
