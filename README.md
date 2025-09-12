# Wordle

This repository is an online wordle game, which support **_2-player_** and **_single player_** wordle guessing game.

It related to the **_task 1, 2 and 4_** of the technical test.

## How to Start: Dev Mode Test

It is recommended to use `docker` to run this project. Please ensure you have Docker and Docker Compose installed on your machine.

1.  **Clone the Repository**

    ```bash
    git clone <your-repository-url>
    cd Wordle
    ```

2.  **Build and Run with Docker Compose**
    In the root directory of the project (where `docker-compose.yml` is located), run the following command:

    ```bash
    docker-compose up --build -d
    ```

    This command will build the Docker images for both the frontend and backend services and run them in detached mode.

3.  **Play the Game**
    Once the containers are up and running, you can access the game by navigating to:
    **`http://localhost:3000/`**

If you want to test **_Multi Player Mode_**, please use a incognito mode webpage to login another account.

**DON'T USE MULTIPLE INCOGNITO MODE WEBPAGE TO LOGIN ANY ACCOUNT!**

## Key Features

### Authentication

- **Related Files**: `views.py` and `Auth.js`
- **User Authentication**: Secure user registration and login system using JWT (JSON Web Tokens).

### Lobby

- **Related Files**: `views.py` and `Lobby.js`
- **Real-time Room List**: `Lobby.js` automatically updates to show available multiplayer rooms.
- **Game Creation**: Players can create new multiplayer rooms or start a private single-player game.

### SinglePlayerGame.js

- **Related Files**: `SinglePlayerGame.js`and `single_player.py`
- **Private Gameplay**: A single Wordle against turn limit.
- **RESTful Communication**: The single-player mode operates via a standard REST API.

### Multiplayer Mode

- **Related Files**: `MultiplayerGame.js` and `consumers.py`
- **Real-time Gameplay**: Powered by Django Channels (WebSockets) for instant updates.
- **Turn-Based System**: Players take turns guessing the word, with the current player clearly indicated.
- **Live Player Events**: Real-time notifications for players joining, leaving, or when a game is aborted.
- **Game Room Management**:
  Mechanism to prevents a single user from opening multiple connections to the same game room, ensuring a stable experience. If a player leaves mid-game, the remaining player is declared the winner, and the game resets.

## Tech Stack & Architecture

### Backend

- **Django & Django REST Framework**

  Provides API for authentication, lobby management, and single-player game logic.

- **Django Channels**

  Enables real-time, bi-directional communication (WebSocket) for multiplayer games.

- **Redis**

  Used as the channel layer backend for Django Channels, allowing message broadcasting and back operation.

- **SQLite**

  Chosen for simplicity and ease of setup in development. It will be swapped for PostgreSQL/MySQL in production.

- **Decision/Trade-off**

  Chose Django for its rapid development and built-in admin/auth features.

  Used Redis for real-time message brokering, as it is the recommended and most stable backend for Django Channels.

  SQLite is used for development to minimize setup complexity; for production, a more robust DB is recommended.

### Frontend

- **React**

  Provides Frontend UI.

- **react-router-dom**

  Handles client-side routing for navigation between lobby, game, and authentication pages.

- **Native WebSocket API**

  Used for real-time communication with the backend in multiplayer mode.

- **Decision/Trade-off**

  React was chosen for its popularity, ecosystem, and ease of state management with hooks.

  Native WebSocket API is used for simplicity and direct control over socket events.

### Deployment

- **Docker & Docker Compose**

  The entire stack is containerized for consistency across environments and easy onboarding.

  `docker-compose` orchestrates the backend, frontend, and Redis services.

- **Decision/Trade-off**

  Docker ensures that all dependencies and environment settings are consistent, and its Portability.
