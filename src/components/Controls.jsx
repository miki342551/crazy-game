import React from 'react';

function Controls({ onDraw, onSkip, canSkip, hasDrawnThisTurn, disabled }) {
    return (
        <div className="controls">
            <button onClick={onDraw} disabled={disabled || hasDrawnThisTurn}>Draw Card</button>
            {canSkip && hasDrawnThisTurn && (
                <button onClick={onSkip} className="skip-btn" disabled={disabled}>
                    Pass
                </button>
            )}
        </div>
    );
}

export default Controls;
