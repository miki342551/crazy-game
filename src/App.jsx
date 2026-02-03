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
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [lobbyPlayers, setLobbyPlayers] = useState([]); // NEW: Track players in lobby

  const networkManager = useRef(new NetworkManager());

  // -- Network Setup --

  const handleHostGame = (onReady) => {
    setIsHost(true);
    setMyPlayerId(0);
    setLobbyPlayers(['Host']); // Host is the first player
    networkManager.current.hostGame((id) => {
      onReady(id);
    });
  };

  const handleJoinGame = (hostId) => {
    setIsHost(false);
    // myPlayerId will be assigned by the host via PLAYER_LIST_UPDATE
    networkManager.current.joinGame(hostId, () => {
      // Connected, but don't leave lobby yet - wait for game start
    });
  };

  // NEW: Handle "Start Game" button click (Host only)
  const handleStartGame = () => {
    if (!isHost || lobbyPlayers.length < 2) return;

    const initialGame = initializeGame(lobbyPlayers);
    setGameState(initialGame);
    setInLobby(false);

    // Broadcast GAME_START to all players
    networkManager.current.broadcast({
      type: 'GAME_START',
      state: initialGame,
      players: lobbyPlayers
    });
  };

  // Register network listeners with access to fresh state
  useEffect(() => {
    // NEW: Listen for player list updates from the host
    networkManager.current.on('onPlayerListUpdate', (players) => {
      setLobbyPlayers(players);
      // Update myPlayerId from networkManager for guests
      if (!isHost && networkManager.current.myPlayerId !== null) {
        setMyPlayerId(networkManager.current.myPlayerId);
      }
    });

    networkManager.current.on('onPeerConnect', (peerName) => {
      console.log(`Peer connected: ${peerName}`);
      // Host updates lobbyPlayers via onPlayerListUpdate callback
    });

    networkManager.current.on('onData', (data) => {
      handleNetworkData(data);
    });
  }); // Run on every render to keep closures fresh.

  const handleNetworkData = (data) => {
    // NEW: Handle GAME_START from Host
    if (data.type === 'GAME_START') {
      setGameState(data.state);
      setLobbyPlayers(data.players);
      // Ensure myPlayerId is set for guests
      if (!isHost && networkManager.current.myPlayerId !== null) {
        setMyPlayerId(networkManager.current.myPlayerId);
      }
      setInLobby(false);
      return;
    }

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
            // Use lobbyPlayers for restart
            newState = initializeGame(lobbyPlayers.length > 0 ? lobbyPlayers : ['Host', 'Guest']);
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
    return (
      <Lobby
        onHost={handleHostGame}
        onJoin={handleJoinGame}
        onStartGame={handleStartGame}
        players={lobbyPlayers}
        isHost={isHost}
      />
    );
  }

  if (!gameState) return <div style={{ color: 'white' }}>Waiting for game state...</div>;

  // Determine if it's my turn for UI indicators (optional, GameBoard might handle it)
  const isMyTurn = gameState.activePlayerIndex === myPlayerId;

  // Find my player name for display
  const myPlayerName = gameState.players[myPlayerId]?.name || (myPlayerId === 0 ? 'Host' : `Player ${myPlayerId}`);

  return (
    <div className="app">
      <div className="header">
        <h1>Crazy Remix</h1>
        <div className="player-info">
          You are: {myPlayerName}
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
          myPlayerId={myPlayerId}
        />
      )}

      {showRules && <RulesOverlay onClose={() => setShowRules(false)} />}
    </div>
  );
}

export default App;
