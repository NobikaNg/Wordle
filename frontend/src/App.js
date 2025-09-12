import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import "./App.css";
import Auth from "./component/Auth";
import Lobby from "./component/Lobby";
import MultiplayerGame from "./component/MultiplayerGame";
import SinglePlayerGame from "./component/SinglePlayerGame";

const PublicRoutes = ({ username }) => {
  if (username) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

const ProtectedRoutes = ({ username }) => {
  if (!username) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

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
            <div className="top-left-user-info">
              <span>User: {username}</span>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          )}
          <Routes>
            <Route element={<PublicRoutes username={username} />}>
              <Route
                path="/login"
                element={<Auth onLoginSuccess={handleLoginSuccess} />}
              />
            </Route>

            <Route element={<ProtectedRoutes username={username} />}>
              <Route path="/" element={<Lobby />} />
              <Route
                path="/game/:roomId"
                element={<MultiplayerGame username={username} />}
              />
              <Route
                path="/single-player-game/:roomId"
                element={<SinglePlayerGame username={username} />}
              />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;
