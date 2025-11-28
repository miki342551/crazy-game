import React from 'react';

function RulesOverlay({ onClose }) {
    return (
        <div className="overlay">
            <div className="rules-content">
                <h2>Rules</h2>
                <ul>
                    <li><strong>8 & Jack:</strong> Wild (Change Suit)</li>
                    <li><strong>2:</strong> Draw 2 (Must match suit)</li>
                    <li><strong>Ace ♠:</strong> Draw 5 (Must match suit)</li>
                    <li><strong>5:</strong> Reverse Direction</li>
                    <li><strong>7:</strong> Chain Play (Play again) OR Skip next player</li>
                </ul>
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
}

export default RulesOverlay;
