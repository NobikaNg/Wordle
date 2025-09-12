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

// 這個保護殼確保「未登入」的使用者才能存取
const PublicRoutes = ({ username }) => {
  if (username) {
    // 如果使用者已登入，跳轉到大廳
    return <Navigate to="/" replace />;
  }
  // 如果未登入，正常顯示登入頁
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
            <div className="user-info">
              <span>Logged in as: {username}</span>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          )}
          <Routes>
            {/* 使用 PublicRoutes 保護登入頁 */}
            <Route element={<PublicRoutes username={username} />}>
              <Route
                path="/login"
                element={<Auth onLoginSuccess={handleLoginSuccess} />}
              />
            </Route>

            {/* 使用 ProtectedRoutes 保護需要登入的頁面 */}
            <Route element={<ProtectedRoutes username={username} />}>
              <Route path="/" element={<Lobby />} />
              <Route path="/game/:roomId" element={<MultiplayerGame />} />
              <Route
                path="/single-player-game/:roomId"
                element={<SinglePlayerGame />}
              />
            </Route>

            {/* 對於任何其他未匹配的路徑，都跳轉到首頁 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;
