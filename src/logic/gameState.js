import { createDeck, shuffleDeck, drawCards } from './deck';
import { isValidMove, getCardEffect } from './rules';

export const INITIAL_HAND_SIZE = 7;

export function initializeGame(playerNames) {
    let deck = shuffleDeck(createDeck());
    const players = playerNames.map((name, index) => {
        // Starter (index 0) gets 6 cards, others get 5
        const count = index === 0 ? 6 : 5;
        const { drawn, newDeck } = drawCards(deck, count);
        deck = newDeck;
        return {
            id: index,
            name,
            hand: drawn,
        };
    });

    return {
        players,
        deck,
        discardPile: [], // Start with empty discard pile
        activeSuit: null,
        activePlayerIndex: 0,
        direction: 1, // 1 or -1
        turnState: 'PLAYING', // PLAYING, SUIT_SELECTION, CHAIN_DECISION
        pendingDraws: 0,
        pendingSkips: 0,
        hasDrawnThisTurn: false,
        winner: null,
        message: `Game Started! ${players[0].name}'s turn to play first card.`,
    };
}

export function nextTurn(gameState) {
    let { activePlayerIndex, direction, players, pendingSkips, turnState } = gameState;

    // Calculate next player, skipping 'pendingSkips' players
    let steps = 1 + pendingSkips;
    let nextIndex = (activePlayerIndex + direction * steps) % players.length;
    if (nextIndex < 0) nextIndex += players.length; // Handle negative modulo

    return {
        ...gameState,
        activePlayerIndex: nextIndex,
        turnState: turnState === 'DRAW_PENDING' ? 'DRAW_PENDING' : 'PLAYING', // Preserve DRAW_PENDING
        pendingSkips: 0, // Reset skips
        hasDrawnThisTurn: false, // Reset draw flag
        message: `${players[nextIndex].name}'s turn.`,
    };
}

export function handleDraw(gameState, count = 1, targetPlayerIndex = null) {
    let { deck, discardPile, players, activePlayerIndex } = gameState;
    let currentDeck = [...deck];
    let currentDiscard = [...discardPile];

    const playerIndex = targetPlayerIndex !== null ? targetPlayerIndex : activePlayerIndex;

    // Reshuffle if needed
    if (currentDeck.length < count) {
        if (currentDiscard.length > 0) {
            const topCard = currentDiscard.pop();
            const cardsToShuffle = currentDiscard;
            currentDiscard = [topCard];
            currentDeck = [...currentDeck, ...shuffleDeck(cardsToShuffle)];
        } else {
            // Not enough cards even with reshuffle? Just draw what we can.
        }
    }

    const { drawn, newDeck } = drawCards(currentDeck, count);

    const newPlayers = [...players];
    newPlayers[playerIndex] = {
        ...newPlayers[playerIndex],
        hand: [...newPlayers[playerIndex].hand, ...drawn],
    };

    let newState = {
        ...gameState,
        deck: newDeck,
        discardPile: currentDiscard,
        players: newPlayers,
    };

    // If active player drew, set flag
    if (targetPlayerIndex === null || targetPlayerIndex === activePlayerIndex) {
        newState.hasDrawnThisTurn = true;
    }

    return newState;
}

export function playCard(gameState, cardIndex, suitSelection = null) {
    const { players, activePlayerIndex, discardPile, activeSuit, direction, turnState } = gameState;
    const player = players[activePlayerIndex];
    const card = player.hand[cardIndex];
    const topCard = discardPile[discardPile.length - 1];

    // Logic for DRAW_PENDING (waiting to counter draw cards)
    if (turnState === 'DRAW_PENDING') {
        const effect = getCardEffect(card);

        // Can only play 2 or Ace of Spades to counter
        if (effect === 'DRAW_2' || effect === 'DRAW_5') {
            // SUIT VALIDATION RULES:
            // - Any 2 can counter any 2 (cross-suit allowed for 2s)
            // - A♠ can ONLY counter spade draw cards (2♠ or A♠)
            // - To counter A♠, you must play 2♠ or A♠

            const isAceOfSpades = card.rank === 'A' && card.suit === '♠';
            const activeSuitIsSpades = activeSuit === '♠';
            const isTwo = card.rank === '2';

            // A♠ can only be used when countering spade draw cards
            if (isAceOfSpades && !activeSuitIsSpades) {
                return {
                    ...gameState,
                    message: `Ace of Spades can only counter spade draw cards!`
                };
            }

            // If trying to counter A♠ with a non-spade card (must be 2♠ or A♠)
            if (activeSuitIsSpades && !isAceOfSpades && !isTwo) {
                return {
                    ...gameState,
                    message: `To counter A♠, you must play 2♠ or A♠!`
                };
            }

            // If playing a 2 (any suit) when active suit is spades, make sure it's 2♠
            if (isTwo && activeSuitIsSpades && card.suit !== '♠') {
                return {
                    ...gameState,
                    message: `To counter A♠, you must play 2♠!`
                };
            }

            // All 2s can counter each other regardless of suit (if not spades)
            // A♠ validation already handled above

            // Counter with another draw card
            const newHand = player.hand.filter((_, i) => i !== cardIndex);
            const newPlayers = [...players];
            newPlayers[activePlayerIndex] = { ...player, hand: newHand };

            let newState = {
                ...gameState,
                players: newPlayers,
                discardPile: [...discardPile, card],
                activeSuit: card.suit,
                message: `${player.name} countered with ${card.rank}${card.suit}!`,
            };

            // Check Win
            if (newHand.length === 0) {
                return { ...newState, winner: player.name, message: `${player.name} Wins!` };
            }

            // Add to pending draws
            if (effect === 'DRAW_2') {
                newState.pendingDraws = (newState.pendingDraws || 0) + 2;
            } else if (effect === 'DRAW_5') {
                newState.pendingDraws = (newState.pendingDraws || 0) + 5;
            }

            // Stay in DRAW_PENDING, next player's turn
            return nextTurn(newState);
        } else {
            // Can't counter, must draw all pending cards
            return { ...gameState, message: `Can only play 2 or Ace of Spades to counter!` };
        }
    }

    // Logic for CHAIN_DECISION (Multi-Chain)
    if (turnState === 'CHAIN_DECISION') {
        // Must match the active chain suit
        if (card.suit !== activeSuit) {
            return { ...gameState, message: `Must play ${activeSuit} to chain!` };
        }

        // Remove card
        const newHand = player.hand.filter((_, i) => i !== cardIndex);
        const newPlayers = [...players];
        newPlayers[activePlayerIndex] = { ...player, hand: newHand };

        let newState = {
            ...gameState,
            players: newPlayers,
            discardPile: [...discardPile, card],
            message: `${player.name} chained ${card.rank}${card.suit}`,
        };

        // Check Win
        if (newHand.length === 0) {
            return { ...newState, winner: player.name, message: `${player.name} Wins!` };
        }

        // CHAIN OR SKIP LOGIC:
        // If we play a card, we cancel the Skip effect of the previous 7.
        if (newState.pendingSkips > 0) {
            newState.pendingSkips--;
        }

        // Accumulate Effects of the NEW card
        const effect = getCardEffect(card);
        if (effect === 'CHAIN_SKIP') { // 7
            newState.pendingSkips = (newState.pendingSkips || 0) + 1;
        } else if (effect === 'DRAW_2') {
            newState.pendingDraws = (newState.pendingDraws || 0) + 2;
        } else if (effect === 'DRAW_5') { // Ace Spades
            newState.pendingDraws = (newState.pendingDraws || 0) + 5;
        }
        // Note: SKIP (5 card) loses its ability when played in a chain

        // Stay in CHAIN_DECISION
        return newState;
    }

    // Normal Play Logic
    // If discardPile is empty, any card is valid.
    if (topCard && !isValidMove(card, topCard, activeSuit)) {
        return { ...gameState, message: 'Invalid move!' };
    }

    // Remove card
    const newHand = player.hand.filter((_, i) => i !== cardIndex);
    const newPlayers = [...players];
    newPlayers[activePlayerIndex] = { ...player, hand: newHand };

    // Check if both current and top card are wild cards
    const isWildCard = card.rank === '8' || card.rank === 'J';
    const topIsWild = topCard && (topCard.rank === '8' || topCard.rank === 'J');
    const wildOnWild = isWildCard && topIsWild;

    let newState = {
        ...gameState,
        players: newPlayers,
        discardPile: [...discardPile, card],
        // If wild-on-wild, keep the previous activeSuit; otherwise set to card's suit
        activeSuit: wildOnWild ? activeSuit : card.suit,
        message: `${player.name} played ${card.rank}${card.suit}`,
    };

    // Check Win
    if (newHand.length === 0) {
        return { ...newState, winner: player.name, message: `${player.name} Wins!` };
    }

    const effect = getCardEffect(card);

    if (effect === 'WILD' && !wildOnWild) {
        // Only trigger wild effect if not playing wild on wild
        if (suitSelection) {
            newState.activeSuit = suitSelection;
            return nextTurn(newState);
        } else {
            return { ...newState, turnState: 'SUIT_SELECTION' };
        }
    } else if (wildOnWild) {
        // Wild on wild: preserve active suit, no suit selection needed
        return nextTurn(newState);
    } else if (effect === 'CHAIN_SKIP') { // 7
        // Start Chain
        newState.pendingSkips = 1;
        newState.turnState = 'CHAIN_DECISION';
        newState.message = `${player.name} played 7. Chain active!`;
        return newState;
    } else if (effect === 'SKIP') {
        newState.pendingSkips = 1;
        return nextTurn(newState);
    } else if (effect === 'DRAW_2') {
        // Stack draw cards instead of immediate draw
        newState.pendingDraws = (newState.pendingDraws || 0) + 2;
        newState.turnState = 'DRAW_PENDING';
        return nextTurn(newState);
    } else if (effect === 'DRAW_5') {
        // Stack draw cards instead of immediate draw
        newState.pendingDraws = (newState.pendingDraws || 0) + 5;
        newState.turnState = 'DRAW_PENDING';
        return nextTurn(newState);
    } else {
        return nextTurn(newState);
    }
}

export function handleSkip(gameState) {
    // If player has already drawn, they can pass without penalty.
    if (gameState.hasDrawnThisTurn) {
        return nextTurn(gameState);
    }

    // Otherwise, penalty draw
    let newState = handleDraw(gameState, 1);
    return nextTurn(newState);
}

export function handleChainPass(gameState) {
    const { activePlayerIndex, direction, players, pendingDraws, turnState } = gameState;

    // Handle DRAW_PENDING: player can't counter, must draw
    if (turnState === 'DRAW_PENDING') {
        let stateAfterDraws = handleDraw(gameState, pendingDraws, activePlayerIndex);
        // Create a new state object with all properties set correctly
        return {
            ...stateAfterDraws,
            message: `${players[activePlayerIndex].name} drew ${pendingDraws} cards. May play.`,
            pendingDraws: 0,
            turnState: 'PLAYING', // Explicitly set to PLAYING to hide popup
            hasDrawnThisTurn: false, // Reset draw flag so they aren't forced to pass immediately
        };
    }

    // Handle CHAIN_DECISION: end of chain
    let victimIndex = (activePlayerIndex + direction + players.length) % players.length;

    let stateAfterDraws = gameState;
    if (pendingDraws > 0) {
        stateAfterDraws = handleDraw(gameState, pendingDraws, victimIndex);
        stateAfterDraws.message = `Chain ended. ${players[victimIndex].name} drew ${pendingDraws}!`;
    } else {
        stateAfterDraws.message = `Chain ended.`;
    }

    // Reset pendingDraws (consumed)
    stateAfterDraws.pendingDraws = 0;

    return nextTurn(stateAfterDraws);
}

export function resolveSuitSelection(gameState, suit) {
    let newState = { ...gameState, activeSuit: suit };
    return nextTurn(newState);
}

