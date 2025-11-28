
export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.id = `${rank}${suit}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(new Card(suit, rank));
    }
  }
  return deck;
}

export function shuffleDeck(deck) {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

export function drawCards(deck, count) {
  const drawn = [];
  const newDeck = [...deck];
  for (let i = 0; i < count; i++) {
    if (newDeck.length > 0) {
      drawn.push(newDeck.pop());
    }
  }
  return { drawn, newDeck };
}
