import logo from "./logo.svg";
import React, { useState } from "react";
import "./App.css";

function App() {
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch("http://localhost:8000/hello/");
      const data = await response.text();
      setMessage(data);
    } catch (error) {
      setMessage("Error fetching data from backend");
      console.error("Error occur when calling backend API", error);
    }
    setGuess("");
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Guess a five-letter word</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            onChange={(e) => setGuess(e.target.value)}
            maxLength="5"
            className="guess-input"
          />
          <button
            type="submit"
            className="submit button"
            style={{ marginTop: "30px" }}
          >
            Submit
          </button>
        </form>
        {message && <p style={{ marginTop: "20px" }}>{message}</p>}
      </header>
    </div>
  );
}

export default App;
