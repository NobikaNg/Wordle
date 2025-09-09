import React, { useState } from "react";
import "./App.css";
import WordleGame from "./WordleGame";

function App() {
  const [isGameStarted, setIsGameStarted] = useState(false);

  const startGame = () => {
    setIsGameStarted(true);
  };

  return (
    <div className="App">
      <header className="App-header">
        {isGameStarted ? (
          <WordleGame />
        ) : (
          <div>
            <h1>Welcome to Wordle</h1>
            <button
              onClick={startGame}
              className="submit-button"
              style={{ fontSize: "1.5rem", padding: "10px 20px" }}
            >
              Game Start
            </button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
