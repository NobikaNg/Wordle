import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Auth from "./Auth";
import Lobby from "./Lobby";
import WordleGame from "./WordleGame";

function App() {
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const token = localStorage.getItem("accessToken");
    if (storedUsername && token) {
      setUsername(storedUsername);
    }
  }, []);

  const handleLoginSuccess = (loggedInUsername) => {
    setUsername(loggedInUsername);
  };
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("username");
    setUsername(null);
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          {username && (
            <div className="user-info">
              <span>Logged in as: {username}</span>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          )}
          <Routes>
            {!username ? (
              // Login page
              <Route
                path="*"
                element={<Auth onLoginSuccess={handleLoginSuccess} />}
              />
            ) : (
              // Lobby and Game room
              <>
                <Route path="/" element={<Lobby />} />
                <Route path="/game/:roomId" element={<WordleGame />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;
