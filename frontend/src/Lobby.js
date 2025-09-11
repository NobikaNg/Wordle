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
    const interval = setInterval(fetchRooms, 5000); // refresh the page per 5s
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

  const handleJoinRoom = (roomId) => {
    navigate(`/game/${roomId}`);
  };

  return (
    <div>
      <h2>Game Lobby</h2>
      <button
        onClick={handleCreateRoom}
        className="submit-button"
        style={{ marginBottom: "20px" }}
      >
        Create New Game
      </button>
      <h3>Available Rooms</h3>
      <div className="room-list">
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <div key={room.room_id} className="room-item">
              <span>Room created by: {room.players[0]}</span>
              <button onClick={() => handleJoinRoom(room.room_id)}>Join</button>
            </div>
          ))
        ) : (
          <p>No available rooms. Create one!</p>
        )}
      </div>
    </div>
  );
}
export default Lobby;
