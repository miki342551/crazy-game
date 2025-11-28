import { SUITS } from './deck';

export const SPECIAL_CARDS = {
    EIGHT: '8',
    JACK: 'J',
    TWO: '2',
    ACE: 'A',
    FIVE: '5',
    SEVEN: '7',
};

export function isValidMove(card, topCard, activeSuit, pendingEffects) {
    // If no top card (start of game), any card is valid
    if (!topCard) return true;

    // 8 and Jack are Wild
    // Can be played anytime regardless of what's on top
    const isWildCard = card.rank === SPECIAL_CARDS.EIGHT || card.rank === SPECIAL_CARDS.JACK;

    if (isWildCard) {
        return true; // Wild cards can always be played
    }

    // Otherwise must match rank or active suit
    if (card.rank === topCard.rank) {
        return true;
    }

    if (card.suit === activeSuit) {
        return true;
    }

    // Special case: Ace of Spades
    if (card.rank === 'A' && card.suit === '♠') {
        if (activeSuit !== '♠') {
            return false;
        }
    }

    // 2 = Suit-locked Draw 2
    if (card.rank === '2') {
        if (card.suit !== activeSuit) {
            return false;
        }
    }

    return false;
}

export function getCardEffect(card) {
    if (card.rank === '8' || card.rank === 'J') return 'WILD';
    if (card.rank === '2') return 'DRAW_2';
    if (card.rank === 'A' && card.suit === '♠') return 'DRAW_5';
    if (card.rank === '5') return 'SKIP';
    if (card.rank === '7') return 'CHAIN_SKIP';
    return null;
}

export function checkWinCondition(hand) {
    return hand.length === 0;
}
