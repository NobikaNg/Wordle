import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Lobby() {
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate();

  const fetchRooms = async () => {
    const response = await fetch("http://localhost:8000/api/list_rooms/");
    const data = await response.json();
    setRooms(data);
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 1000); // refresh the page per 1s
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
      alert("Failed to cteate room");
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
    <div>
      <h2>Game Lobby</h2>
      <div style={{ marginBottom: "20px" }}>
        <button onClick={handleCreateRoom} style={{ marginRight: "10px" }}>
          Create Multiplayer Room
        </button>
        <button onClick={handleStartSinglePlayer}>
          Start Single Player Game
        </button>
      </div>
      <h3>Available Rooms</h3>
      <ul>
        {rooms.map((room) => (
          <li key={room.room_id}>
            Room by {room.host} ({room.players_count}/2) -{" "}
            <span style={{ fontWeight: "bold" }}>
              {room.game_state.toUpperCase()}
            </span>
            <button
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
