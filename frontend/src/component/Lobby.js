import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Lobby() {
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate();

  const fetchRooms = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/list_rooms/");
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = async () => {
    const token = localStorage.getItem("accessToken");
    const response = await fetch("http://localhost:8000/api/create_room/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (response.ok) {
      navigate(`/game/${data.room_id}`);
    } else {
      alert("Failed to create room");
    }
  };

  const handleStartSinglePlayer = async () => {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(
      "http://localhost:8000/api/single_player/start/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    if (response.ok) {
      navigate(`/single-player-game/${data.room_id}`);
    } else {
      alert("Failed to start single player game.");
    }
  };

  const handleJoinRoom = (roomId) => {
    navigate(`/game/${roomId}`);
  };

  return (
    <div className="centered-container">
      <h2>Game Lobby</h2>
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={handleCreateRoom}
          className="button"
          style={{ marginRight: "10px" }}
        >
          Create Multiplayer Room
        </button>
        <button onClick={handleStartSinglePlayer} className="button">
          Start Single Player Game
        </button>
      </div>
      <h3>Available Rooms</h3>
      <ul className="room-list">
        {rooms.map((room) => (
          <li key={room.room_id} className="room-list-item">
            <div className="room-info">
              <span>
                Room by {room.host} ({room.players_count}/2)
              </span>
              <span className="room-state">
                {room.game_state.toUpperCase()}
              </span>
            </div>
            <button
              className="button"
              onClick={() => handleJoinRoom(room.room_id)}
              disabled={room.is_full || room.game_state === "playing"}
            >
              Join
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
export default Lobby;
