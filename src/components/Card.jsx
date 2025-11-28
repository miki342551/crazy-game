import React from 'react';

const SUIT_COLORS = {
    '♠': 'black',
    '♣': 'black',
    '♥': 'red',
    '♦': 'red',
};

function Card({ card, onClick, isPlayable }) {
    const color = SUIT_COLORS[card.suit];

    return (
        <div
            className={`card ${isPlayable ? 'playable' : ''}`}
            onClick={onClick}
            style={{ color }}
        >
            <div className="card-top">{card.rank}{card.suit}</div>
            <div className="card-center">{card.suit}</div>
            <div className="card-bottom">{card.rank}{card.suit}</div>
        </div>
    );
}

export default Card;
