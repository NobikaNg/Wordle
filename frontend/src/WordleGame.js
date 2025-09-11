import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import "./App.css";

function WordleGame() {
  const { roomId } = useParams();
  const [gameState, setGameState] = useState(null);
  const [guess, setGuess] = useState("");
  const socketRef = useRef(null);
  const username = localStorage.getItem("username");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      return;
    }

    const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
    const wsPath = `${wsScheme}://localhost:8000/ws/wordle/${roomId}/?token=${token}`;

    socketRef.current = new WebSocket(wsPath);

    socketRef.current.onopen = () => {
      console.log("WebSocket connected!");
    };

    socketRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "game_state_update") {
        setGameState(data.game_state);
      } else if (data.type === "error") {
        alert(`Error: ${data.message}`);
      }
    };

    socketRef.current.onclose = () => {
      console.error("WebSocket closed.");
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [roomId]);

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
    return <div>Loading game... Waiting for players...</div>;
  }

  const isMyTurn =
    gameState.players[gameState.current_turn_player_index] === username;

  return (
    <div>
      <h1>Wordle Game - Room: {roomId.substring(0, 8)}</h1>
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

      {gameState.game_state === "finished" ? (
        <div>
          <h2>Game Over!</h2>
          <p>Winner: {gameState.winner}</p>
        </div>
      ) : (
        <div className="input-area">
          <p>
            {isMyTurn
              ? "It's your turn!"
              : `Waiting for ${
                  gameState.players[gameState.current_turn_player_index]
                }...`}
          </p>
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value.toUpperCase())}
            maxLength="5"
            disabled={!isMyTurn}
          />
          <button onClick={makeGuess} disabled={!isMyTurn}>
            Submit
          </button>
        </div>
      )}
    </div>
  );
}

export default WordleGame;
