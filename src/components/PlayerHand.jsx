import React from 'react';
import Card from './Card';

function PlayerHand({ player, onPlayCard, isActive, turnState }) {
    const cardCount = player.hand.length;

    // Calculate dynamic overlap based on number of cards
    // More cards = less overlap to keep them all visible
    const calculateOverlap = () => {
        // Check if mobile
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const baseOverlap = isMobile ? -30 : -40;

        // Adjust overlap based on card count
        if (cardCount <= 7) return baseOverlap; // Normal overlap
        if (cardCount <= 10) return baseOverlap + 5; // Slight reduction
        if (cardCount <= 13) return baseOverlap + 10; // More reduction
        return baseOverlap + 15; // Maximum reduction for many cards
    };

    const cardOverlap = calculateOverlap();

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
                        style={{ marginRight: index === player.hand.length - 1 ? '0' : `${cardOverlap}px` }}
                    />
                ))}
            </div>
        </div>
    );
}

export default PlayerHand;
