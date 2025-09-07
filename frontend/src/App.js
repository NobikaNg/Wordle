import logo from "./logo.svg";
import React, { useState } from "react";
import "./App.css";

function App() {
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState("");

  const handleInputChange = (event) => {
    setGuess(event.target.value);
  };

  const handleSubmit = async () => {
    if (!guess.trim()) {
      setMessage("Please enter a guess.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/wordle_judgment/?guess=${encodeURIComponent(
          guess
        )}`
      );
      const data = await response.text();
      setMessage(data);
    } catch (error) {
      setMessage("Error fetching data from backend");
      console.error("Error occur when calling backend API", error);
    }
    setGuess("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Guess a five-letter word</h1>
        <div>
          <input
            type="text"
            value={guess}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            maxLength="5"
            className="guess-input"
            placeholder="Enter your guess"
          />
          <button
            onClick={handleSubmit}
            className="submit button"
            style={{ marginTop: "30px" }}
          >
            Submit
          </button>
        </div>
        {message && <p style={{ marginTop: "20px" }}>{message}</p>}
      </header>
    </div>
  );
}

export default App;
