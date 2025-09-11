import React, { useState } from "react";

function Auth({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleAuth = async (endpoint) => {
    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError("");
    try {
      const response = await fetch(`http://localhost:8000/api/${endpoint}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("accessToken", data.access);
        localStorage.setItem("username", username);
        onLoginSuccess(username);
      } else {
        const errorMessage = data.detail || data.error || "An error occurred.";
        setError(errorMessage);
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    }
  };

  return (
    <div>
      <h1>Welcome to Wordle Battle</h1>
      <h2>Enter your credentials</h2>
      <div className="input-area">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your username"
          className="guess-input"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password, length>=5"
          className="guess-input"
          style={{ marginTop: "10px" }}
        />
      </div>
      <div className="button-group" style={{ marginTop: "20px" }}>
        <button onClick={() => handleAuth("login")} className="submit-button">
          Login
        </button>
        <button
          onClick={() => handleAuth("register")}
          className="submit-button"
          style={{ marginLeft: "10px" }}
        >
          Register
        </button>
      </div>
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}

export default Auth;
