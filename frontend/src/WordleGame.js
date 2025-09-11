import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./App.css";

function WordleGame() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [guess, setGuess] = useState("");
  const [statusMessage, setStatusMessage] = useState("Connecting to room...");
  const [eventNotification, setEventNotification] = useState("");
  const socketRef = useRef(null);
  const username = localStorage.getItem("username");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setStatusMessage("Authentication token not found. Please log in again.");
      return;
    }

    const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
    const wsPath = `${wsScheme}://localhost:8000/ws/wordle/${roomId}/?token=${token}`;

    socketRef.current = new WebSocket(wsPath);

    socketRef.current.onopen = () => {
      console.log("WebSocket connected!");
      setStatusMessage("Loading game state...");
    };

    // game status handler
    socketRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);

      // clean the notification 5s later
      const showEvent = (message, duration = 5000) => {
        setEventNotification(message);
        setTimeout(() => setEventNotification(""), duration);
      };

      if (data.type === "game_state_update") {
        setGameState(data.game_state);
      } else if (data.type === "player_join") {
        if (data.username !== username) {
          showEvent(`Player ${data.username} entered the room!`);
        }
      } else if (data.type === "player_leave") {
        showEvent(`Player ${data.username} left the room.`);
      } else if (data.type === "game_aborted") {
        showEvent(data.message, 8000);
      } else if (data.type === "error") {
        showEvent(`Error: ${data.message}`);
      }
    };

    socketRef.current.onclose = (event) => {
      console.error("WebSocket closed.", event);
      if (event.code === 4000) {
        setStatusMessage(
          "Connection replaced by a new one from another location."
        );
      } else if (event.code === 4002) {
        setStatusMessage("Room is full. Cannot join.");
        navigate("/lobby");
      } else if (event.code === 4004) {
        setStatusMessage("Room not found.");
        navigate("/lobby");
      } else {
        setStatusMessage("Connection lost. Please refresh the page.");
      }
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [roomId, username]);

  const handleLeaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({ type: "leave_room" }));
    }
    navigate("/lobby");
  };

  const handleStartGame = () => {
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({ type: "start_game" }));
    }
  };

  const makeGuess = () => {
    if (guess.length !== 5) {
      alert("Guess must be 5 letters long.");
      return;
    }
    socketRef.current.send(
      JSON.stringify({
        type: "make_guess",
        guess: guess,
      })
    );
    setGuess("");
  };

  if (!gameState) {
    return <div>{statusMessage}</div>;
  }

  const isMyTurn =
    gameState.game_state === "playing" &&
    gameState.players[gameState.current_turn_player_index] === username;
  const isHost = gameState.host === username;

  const renderStatusMessage = () => {
    switch (gameState.game_state) {
      case "waiting":
        return `Waiting for players... (${gameState.players.length} / 2)`;
      case "playing":
        return isMyTurn
          ? "It's your turn!"
          : `Waiting for ${
              gameState.players[gameState.current_turn_player_index]
            }...`;
      case "finished":
        return gameState.winner === "draw"
          ? "It's a draw!"
          : `Game Over! Winner: ${gameState.winner}`;
      default:
        return "Loading...";
    }
  };

  return (
    <div>
      <h1>Wordle Game - Room: {roomId.substring(0, 8)}</h1>
      <button onClick={handleLeaveRoom} className="leave-button">
        Leave Room
      </button>

      <p className="status-message">{renderStatusMessage()}</p>
      {eventNotification && (
        <p className="event-notification">{eventNotification}</p>
      )}

      <div className="game-board">
        {gameState.history.map((turn, turnIndex) => (
          <div key={turnIndex} className="guess-row">
            {turn.result.map((charInfo, charIndex) => (
              <div
                key={charIndex}
                className={`char-box ${charInfo.status.toLowerCase()}`}
              >
                {charInfo.char}
              </div>
            ))}
          </div>
        ))}
      </div>

      {gameState.game_state === "waiting" && (
        <div className="input-area">
          <h3>Players in room:</h3>
          <ul>
            {gameState.players.map((p) => (
              <li key={p}>
                {p} {p === gameState.host ? "(Host)" : ""}
              </li>
            ))}
          </ul>
          {isHost && gameState.is_full && (
            <button onClick={handleStartGame}>Start Game</button>
          )}
        </div>
      )}

      {gameState.game_state === "playing" && (
        <div className="input-area">
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value.toUpperCase())}
            maxLength="5"
            disabled={!isMyTurn}
            placeholder={
              isMyTurn ? "Enter your 5-letter guess" : "Wait for your turn..."
            }
            onKeyPress={(e) => e.key === "Enter" && isMyTurn && makeGuess()}
          />
          <button onClick={makeGuess} disabled={!isMyTurn}>
            Submit
          </button>
        </div>
      )}

      {gameState.game_state === "finished" && (
        <div className="input-area">
          <p>
            The word was:{" "}
            <strong>
              {gameState.history.length > 0
                ? gameState.history[0].guess
                : "..."}
            </strong>
          </p>
          <button onClick={() => navigate("/lobby")}>Back to Lobby</button>
        </div>
      )}
    </div>
  );
}

export default WordleGame;
