import React from 'react';
import Card from './Card';

function PlayerHand({ player, onPlayCard, isActive, turnState }) {
    return (
        <div className={`player-hand ${isActive ? 'active' : ''}`}>
            <h3>{player.name}'s Hand</h3>
            <div className="cards-container">
                {player.hand.map((card, index) => (
                    <Card
                        key={card.id}
                        card={card}
                        onClick={() => isActive && (turnState === 'PLAYING' || turnState === 'CHAIN_DECISION' || turnState === 'DRAW_PENDING') && onPlayCard(index)}
                        isPlayable={isActive}
                    />
                ))}
            </div>
        </div>
    );
}

export default PlayerHand;
