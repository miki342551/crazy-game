import React, { useState, useEffect, useRef } from 'react';
import { initializeGame, playCard, handleDraw, handleSkip, handleChainPass, resolveSuitSelection } from './logic/gameState';
import GameBoard from './components/GameBoard';
import RulesOverlay from './components/RulesOverlay';
import Lobby from './components/Lobby';
import { NetworkManager } from './logic/network';
import './index.css';

function App() {
  const [gameState, setGameState] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [suitSelection, setSuitSelection] = useState(null);
  const [inLobby, setInLobby] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState(null); // 0 for Host, 1 for Peer

  const networkManager = useRef(new NetworkManager());

  // -- Network Setup --

  const handleHostGame = (onReady) => {
    setIsHost(true);
    setMyPlayerId(0);
    networkManager.current.hostGame((id) => {
      onReady(id);
    });
  };

  const handleJoinGame = (hostId) => {
    setIsHost(false);
    setMyPlayerId(1);
    networkManager.current.joinGame(hostId, () => {
      setInLobby(false);
    });
  };

  // Register network listeners with access to fresh state
  useEffect(() => {
    networkManager.current.on('onPeerConnect', (peerId) => {
      setGameState(prevState => {
        if (prevState) {
          console.log('Peer connected to running game. Syncing...');
          return { ...prevState };
        } else {
          console.log('Peer connected. Starting new game...');
          const initialGame = initializeGame(['Host', 'Guest']);
          setInLobby(false);
          return initialGame;
        }
      });
    });

    networkManager.current.on('onData', (data) => {
      handleNetworkData(data);
    });
  }); // Run on every render to keep closures fresh. 
  // NetworkManager.on overwrites the callback, so this is safe and correct for this implementation.

  const handleNetworkData = (data) => {
    if (data.type === 'STATE_UPDATE') {
      setGameState(data.state);
    } else if (data.type === 'ACTION') {
      // Only Host processes actions
      if (isHost) {
        processAction(data.action, data.payload);
      } else {
        console.warn('Received ACTION but I am not Host (isHost:', isHost, ')');
      }
    }
  };

  // Broadcast state changes (Host only)
  useEffect(() => {
    if (isHost && gameState) {
      networkManager.current.broadcast({
        type: 'STATE_UPDATE',
        state: gameState
      });
    }
  }, [gameState, isHost]);


  // -- Game Logic (Host Authority) --

  const processAction = (actionType, payload) => {
    setGameState(prevState => {
      if (!prevState) return null;

      try {
        let newState = prevState;

        switch (actionType) {
          case 'PLAY_CARD':
            newState = playCard(prevState, payload.cardIndex, payload.suitSelection);
            break;
          case 'DRAW':
            newState = handleDraw(prevState, 1);
            break;
          case 'SKIP':
            newState = handleSkip(prevState);
            break;
          case 'CHAIN_PASS':
            newState = handleChainPass(prevState);
            break;
          case 'SELECT_SUIT':
            newState = resolveSuitSelection(prevState, payload.suit);
            break;
          case 'RESTART':
            newState = initializeGame(['Host', 'Guest']);
            break;
          default:
            break;
        }
        return newState;
      } catch (error) {
        console.error('Error processing action:', error);
        alert(`Game Error: ${error.message}`);
        return prevState;
      }
    });
  };

  // -- UI Handlers --

  const sendAction = (actionType, payload = {}) => {
    console.log('Sending action:', actionType);
    if (isHost) {
      processAction(actionType, payload);
    } else {
      networkManager.current.broadcast({
        type: 'ACTION',
        action: actionType,
        payload
      });
    }
  };

  const onPlayCard = (cardIndex) => {
    // Check turn locally first to prevent spam (optional but good UX)
    if (gameState.activePlayerIndex !== myPlayerId) return;

    // If suit selection needed, we might need to handle that.
    // The current logic in GameBoard/App handles suit selection via state.
    // If we need to select suit, we do it locally then send action?
    // Or we send PLAY_CARD, and if it returns SUIT_SELECTION, we wait?

    // For simplicity: If we have a suit selection pending in UI, send it.
    // But `playCard` logic handles the transition.

    // Actually, `playCard` takes `suitSelection` as arg.
    // So we send it if we have it.
    sendAction('PLAY_CARD', { cardIndex, suitSelection });
    setSuitSelection(null);
  };

  const onDraw = () => {
    if (gameState.activePlayerIndex !== myPlayerId) return;
    sendAction('DRAW');
  };

  const onSkip = () => {
    if (gameState.activePlayerIndex !== myPlayerId) return;
    sendAction('SKIP');
  };

  const onChainPass = () => {
    if (gameState.activePlayerIndex !== myPlayerId) return;
    sendAction('CHAIN_PASS');
  };

  const onSelectSuit = (suit) => {
    if (gameState.activePlayerIndex !== myPlayerId) return;
    sendAction('SELECT_SUIT', { suit });
  };

  const onRestart = () => {
    // Only host can restart usually, or vote. Let's allow anyone for now.
    sendAction('RESTART');
  };

  if (inLobby) {
    return <Lobby onHost={handleHostGame} onJoin={handleJoinGame} />;
  }

  if (!gameState) return <div style={{ color: 'white' }}>Waiting for game state...</div>;

  // Determine if it's my turn for UI indicators (optional, GameBoard might handle it)
  const isMyTurn = gameState.activePlayerIndex === myPlayerId;

  return (
    <div className="app">
      <div className="header">
        <h1>Crazy Remix</h1>
        <div className="player-info">
          You are: {myPlayerId === 0 ? 'Host' : 'Guest'}
        </div>
        <button onClick={() => setShowRules(true)}>Rules</button>
        <button onClick={onRestart}>Restart</button>
      </div>

      {gameState.winner ? (
        <div className="winner-screen">
          <h2>{gameState.winner} Wins!</h2>
          <button onClick={onRestart}>Play Again</button>
        </div>
      ) : (
        <GameBoard
          gameState={gameState}
          onPlayCard={onPlayCard}
          onDraw={onDraw}
          onSkip={onSkip}
          onChainPass={onChainPass}
          onSelectSuit={onSelectSuit}
          myPlayerId={myPlayerId} // Pass this down if GameBoard needs to know which hand is "mine"
        />
      )}

      {showRules && <RulesOverlay onClose={() => setShowRules(false)} />}
    </div>
  );
}

export default App;
