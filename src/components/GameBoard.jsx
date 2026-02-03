import React from 'react';
import Card from './Card';
import PlayerHand from './PlayerHand';
import Controls from './Controls';

function GameBoard({ gameState, onPlayCard, onDraw, onSkip, onChainPass, onSelectSuit, myPlayerId }) {
    const { players, activePlayerIndex, discardPile, activeSuit, direction, turnState, message } = gameState;

    // Identify my player and the active player
    const localPlayerId = myPlayerId !== null ? myPlayerId : activePlayerIndex;
    const myPlayer = players[localPlayerId];
    const activePlayer = players[activePlayerIndex];
    const isMyTurn = localPlayerId === activePlayerIndex;

    const topCard = discardPile[discardPile.length - 1];

    return (
        <div className="game-board">
            <div className="info-bar">
                <div className="turn-indicator">
                    {isMyTurn ? "YOUR TURN" : `${activePlayer.name}'s Turn`}
                    <span className="direction-arrow">{direction === 1 ? ' ↻' : ' ↺'}</span>
                </div>
                <div className="message">{message}</div>
                <div className="active-suit">Current Suit: {activeSuit}</div>
            </div>

            <div className="table-center">
                <div className="deck-area">
                    <div className="card back">Deck</div>
                </div>
                <div className="discard-area">
                    {topCard ? (
                        <Card card={topCard} isPlayable={false} />
                    ) : (
                        <div className="card empty-pile"></div>
                    )}
                </div>
            </div>

            {turnState === 'SUIT_SELECTION' && isMyTurn && (
                <div className="suit-selector">
                    <h3>Choose Suit:</h3>
                    {['♠', '♥', '♦', '♣'].map(suit => (
                        <button key={suit} onClick={() => onSelectSuit(suit)}>{suit}</button>
                    ))}
                </div>
            )}

            {turnState === 'DRAW_PENDING' && isMyTurn && (
                <div className="chain-decision">
                    <h3>Draw or Counter</h3>
                    <button onClick={onChainPass}>
                        Draw {gameState.pendingDraws} Cards
                    </button>
                </div>
            )}

            {turnState === 'CHAIN_DECISION' && isMyTurn && (
                <div className="chain-decision">
                    <h3>Chain Play! Play another {activeSuit} or Pass?</h3>
                    <button onClick={onChainPass}>
                        {gameState.pendingSkips > 0 ? 'Pass (Skip Next)' : 'Pass (End Turn)'}
                    </button>
                </div>
            )}

            <div className="player-area">
                <PlayerHand
                    player={myPlayer}
                    onPlayCard={onPlayCard}
                    isActive={isMyTurn}
                    turnState={turnState}
                />
                <Controls
                    onDraw={onDraw}
                    onSkip={onSkip}
                    canSkip={turnState === 'PLAYING' && isMyTurn}
                    hasDrawnThisTurn={gameState.hasDrawnThisTurn}
                    disabled={!isMyTurn}
                />
            </div>

            {/* Show other players */}
            <div className="other-players" style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '20px',
                flexWrap: 'wrap',
                marginBottom: '20px'
            }}>
                {players.map((p, i) => (
                    i !== localPlayerId && (
                        <div key={i} className={`other-player ${i === activePlayerIndex ? 'active' : ''}`} style={{
                            background: i === activePlayerIndex ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255,255,255,0.1)',
                            padding: '15px',
                            borderRadius: '12px',
                            minWidth: '120px',
                            textAlign: 'center',
                            border: i === activePlayerIndex ? '2px solid gold' : '1px solid rgba(255,255,255,0.2)'
                        }}>
                            <div className="player-avatar" style={{ fontSize: '2rem' }}>👤</div>
                            <div className="player-name" style={{ fontWeight: 'bold', margin: '5px 0' }}>{p.name}</div>
                            <div className="player-cards" style={{ color: '#aaa' }}>{p.hand.length} cards</div>
                            {i === activePlayerIndex && <div className="thinking-indicator" style={{ color: 'gold', marginTop: '5px' }}>Thinking...</div>}
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}

export default GameBoard;
