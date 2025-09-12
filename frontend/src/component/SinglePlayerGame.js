import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../App.css";

function SinglePlayerGame() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [guess, setGuess] = useState("");
  const [statusMessage, setStatusMessage] = useState("Setting up your game...");
  const username = localStorage.getItem("username");

  useEffect(() => {
    if (!username) {
      return null;
    }
    const token = localStorage.getItem("accessToken");
    if (!token) {
      return;
    }

    setGameState({
      players: [username],
      host: username,
      history: [],
      game_state: "waiting",
      winner: null,
    });
    setStatusMessage(""); // Clear "Connecting..." message
  }, [navigate, username]);

  if (!username) {
    return null;
  }

  const handleLeaveRoom = () => {
    navigate("/lobby");
  };

  const handleStartGame = () => {
    setGameState({ ...gameState, game_state: "playing" });
  };

  const makeGuess = async () => {
    if (guess.length !== 5) {
      alert("Guess must be 5 letters long.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `http://localhost:8000/api/single_player/guess/${roomId}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ guess: guess.toLowerCase() }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit guess.");
      }

      const data = await response.json();
      const newHistory = [
        ...gameState.history,
        { guess: guess.toUpperCase(), result: data.result },
      ];

      const newGameState = {
        ...gameState,
        history: newHistory,
        game_state: data.game_result === "Continue" ? "playing" : "waiting",
        winner:
          data.game_result === "Win"
            ? username
            : data.game_result === "Lose"
            ? "Computer"
            : null,
      };
      setGameState(newGameState);
    } catch (error) {
      alert(error.message);
    }
    setGuess("");
  };

  const handlePlayAgain = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `http://localhost:8000/api/single_player/replay/${roomId}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start a new round.");
      }

      const newGameState = await response.json();
      setGameState(newGameState);
    } catch (error) {
      alert(error.message);
      navigate("/lobby");
    }
  };

  if (!gameState) {
    return <div>{statusMessage}</div>;
  }

  const isGameOver = gameState.game_state === "waiting" && gameState.winner;

  const renderStatusMessage = () => {
    if (isGameOver) {
      return gameState.winner === username
        ? "Congratulations, you won!"
        : "Game Over! Better luck next time.";
    }
    if (gameState.game_state === "waiting") {
      return "Single Player Game - Ready to start!";
    }
    return "Make your guess!";
  };

  return (
    <div>
      <button onClick={handleLeaveRoom} className="top-right-action-button">
        Back to Lobby
      </button>

      <div className="centered-container">
        <h1>Wordle Game - Room: {roomId.substring(0, 8)} (Single Player)</h1>
        <p className="status-message">{renderStatusMessage()}</p>
      </div>

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

      <div className="centered-container">
        {gameState.game_state === "waiting" && !isGameOver && (
          <div className="input-area">
            <button onClick={handleStartGame} className="button">
              Start Game
            </button>
          </div>
        )}

        {gameState.game_state === "playing" && (
          <div className="input-area">
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value.toUpperCase())}
              maxLength="5"
              onKeyPress={(e) => e.key === "Enter" && makeGuess()}
              placeholder="Enter your 5-letter guess"
              className="guess-input"
            />
            <button onClick={makeGuess} className="button">
              Submit
            </button>
          </div>
        )}

        {isGameOver && (
          <div className="input-area">
            <p>The game has ended.</p>
            <button onClick={handlePlayAgain} className="button">
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SinglePlayerGame;
