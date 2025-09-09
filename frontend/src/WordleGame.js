import React, { useState, useEffect } from "react";
import "./App.css";

function WordleGame() {
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [turnInfo, setTurnInfo] = useState("");
  const [isGameOver, setIsGameOver] = useState(false);

  const handleNewGame = async () => {
    try {
      const response = await fetch("http://localhost:8000/game_start/", {
        credentials: "include",
      });
      const data = await response.json();
      setMessage(
        data.message || "A new game has started! Make your first guess."
      );
    } catch (error) {
      setMessage("Error starting a new game.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    handleNewGame();
  }, []);

  const handleSubmit = async () => {
    if (
      !guess.trim() ||
      isLoading ||
      guess.length !== 5 ||
      !/^[a-zA-Z]{5}$/.test(guess)
    ) {
      if (guess.length !== 5)
        setMessage("Guess must be 5 letters, please enter again!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/wordle_judgment/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ guess: guess }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        if (data.result) {
          setHistory((prevHistory) => [...prevHistory, data.result]);
        }
        setTurnInfo(`Turn: ${data.turn} / ${data.max_turns}`);

        if (data.game_result === "Win") {
          setMessage("You win!");
          setIsGameOver(true);
        } else if (data.game_result === "Lose") {
          setMessage("You lost!");
          setIsGameOver(true);
        } else {
          setMessage("Keep trying!");
        }
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage("Error fetching data from backend");
      console.error("Error occur when calling backend API", error);
    } finally {
      setIsLoading(false);
      setGuess("");
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <>
      <h1>Wordle Game</h1>
      <div className="game-board">
        {history.map((turnResult, index) => (
          <div key={index} className="guess-row">
            {turnResult.map((charInfo, charIndex) => (
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

      {isGameOver ? (
        <button
          onClick={handleNewGame}
          disabled={isLoading}
          style={{ marginTop: "20px" }}
        >
          New Game
        </button>
      ) : (
        <div className="input-area">
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            maxLength="5"
            className="guess-input"
            placeholder="Enter Your Guess"
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="submit-button"
          >
            {isLoading ? "Checking..." : "Submit"}
          </button>
        </div>
      )}
      <p className="message-text">{message}</p>
      <p className="turn-info">{turnInfo}</p>
    </>
  );
}

export default WordleGame;
