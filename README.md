<img width="80" src="https://github.com/AdenWhitworth/checkmate_Front-End/raw/master/src/Images/King%20Logo%20Black.svg" alt="Checkmate Logo">

# Checkmate Back-End

Welcome to the **Checkmate Back-End**, the API for the Checkmate game. This Node.js backend API manages active chess games (human and bot), user authentication, in-game chat, interactive puzzles, and ELO ranking systems. It ensures smooth, real-time gameplay and communication through WebSockets integration.

## Table of Contents
- [Overview](#overview)
- [Checkmate Demo](#checkmate-demo)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Firebase Setup Guide](#firebase-setup-guide)
  - [Running the Backend](#running-the-backend)
- [API WebSocket Endpoints](#api-websocket-endpoints)
- [Database Structure](#database-structure)
- [Future Features](#future-features)
- [Contributing](#contributing)
- [License](#license)

## Overview

**Checkmate** is an application that enables players to challenge friends, hone their skills against AI-powered bots, practice chess strategies with interactive puzzles, and track their progress in real-time. The backend, built with Node.js and WebSocket, manages all server-side logic, ensuring a smooth, responsive gameplay experience.

## Checkmate Demo

The Checkmate application is live and can be accessed here: [Checkmate Demo](https://checkmateplay.com). You can explore all features of the game, including real-time gameplay, puzzles, chat, and rankings.

<img width="600" src="https://github.com/AdenWhitworth/aden_whitworth_portfolio/raw/master/src/Images/chess_demo.png" alt="Checkmate Demo">

### Test User Credentials

Try out the app using the following demo accounts:

- **Emails:** demo1@gmail.com & demo2@gmail.com
- **Password:** PortfolioDemo1!

>**Note**: You can even play against yourself by opening the application in two separate browser windows.

## Features

- **WebSocket-Based Real-Time Gameplay**: Engage in real-time chess games with your friends using WebSocket-based updates for a seamless experience.
- **User Authentication & Authorization**: Handle secure login, registration, and user management with JWT-based authentication.
- **Matchmaking & Game Room Management**: Create, join, and manage game rooms, making it easy to start games with friends.
- **Player Stats & Ranking System**: Track player performance and compare ELO rankings with friends, updating results in real-time.
- **In-Game Chat Support**: Use real-time chat to communicate with your opponent during matches.
- **Game Persistence**: Stay in the game, even if you lose connection, with a reliable rejoin feature.
- **AI Bot Matchmaking**: Create and manage games against skill-based AI bot opponents, offering tailored practice to improve strategic skills.
- **Best Move Hint**: Receive strategic guidance with best move hints powered by the master-level AI bot, helping you learn and improve during gameplay.
- **Interactive Puzzles**: Solve over 3000 puzzles designed for various skill levels, helping you improve your chess strategies and tactics.

## Technologies Used

- **Node.js**: Backend runtime environment for executing JavaScript on the server.
- **TypeScript**: A strongly typed superset of JavaScript that enhances code quality and provides better tooling and type safety during development.
- **Express.js**: Web framework for building the RESTful API.
- **JWT (JSON Web Tokens)**: Used for secure authentication.
- **Socket.IO**: A library that facilitates real-time, bidirectional communication between clients and servers, crucial for features like live updates and notifications.
- **uuid.js**: A library used to generate unique identifiers (UUIDs), essential for creating distinct and secure references for users, games, and various entities in web applications.
- **onnxruntime-node**:  A high-performance runtime for executing ONNX models in Node.js, enabling seamless integration of AI-powered features such as chess move predictions and strategic analysis into the backend.
- **Firebase**:
  - **Authentication**: Provides secure sign-in via various methods, including email/password, Google, etc.
  - **Admin**: Firebase Admin SDK is used for server-side operations like managing users, securely accessing Firebase databases, and performing other privileged tasks such as setting up custom claims for user roles and managing user accounts programmatically.
- **Linchess Database**: Open-source database containing over 5 million chess puzzles with solutions, used to power interactive puzzle features at varying skill levels.
- **Stockfish**: A powerful, open-source chess engine used for move prediction and analysis, leveraging advanced algorithms to evaluate positions and generate optimal moves based on various skill levels.

## Getting Started

Follow the instructions below to set up the project on your local machine.

### Prerequisites

Make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AdenWhitworth/checkmate_Back-End.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables
Create a `.env` file in the root directory and define the following variables:

  ```plain text
  # Application Configuration
  PORT=8080  # The port on which the server will run
  BASE_URL=your_frontend_url  # The base URL for your frontend application
  BASE_URL_WWW=your_front-end_www_url  # The base www URL for your frontend application
  TEST_URL=your_testing_frontend_url  # The base test URL for your frontend application
  SHOULD_UPLOAD_PUZZLES=your_puzzle_upload_boolean # Boolean flag to control whether chess puzzles are uploaded to the database on server startup.

  #Firebase Configuration
  type=service_account  # Firebase service account type
  project_id=your_project_id  # Firebase project ID
  private_key_id=your_private_key_id  # Private key ID for service account authentication
  private_key="your_private_key"  # Private key for service account, ensure it's in quotes
  client_email=your_client_email  # Email associated with the Firebase service account
  client_id=your_client_id  # Client ID of the Firebase service account
  auth_uri=https://accounts.google.com/o/oauth2/auth  # Authentication URI
  token_uri=https://oauth2.googleapis.com/token  # Token URI for OAuth 2.0
  auth_provider_x509_cert_url=https://www.googleapis.com/oauth2/v1/certs  # URL for Google's public certificates
  client_x509_cert_url=your_client_x509_cert_url  # URL for the service account's public certificate
  universe_domain=your_firebase_domain  # Your Firebase app domain
  ```

### Firebase Setup Guide

1. Create a Firebase Project:
  - Go to Firebase Console and sign in with your Google account.
  - Click **Add Project** and follow the prompts.
2. Install Firebase in Your Project:
  - In your project folder, install the Firebase SDK via npm:
 ```bash
   npm install firebase-admin
   ```
3. Set up Firebase configuration variables in Your React App `.env`.
4. Set Up Firebase Authentication
  - In the Firebase Console, navigate to Firestore Database and create your database. Add collections for users, games, etc.
5. Set Up Firestore Database:
  -  In the Firebase Console, navigate to Firestore Database and create your database. Add collections for users, games, etc.

### Running the Backend

Once the environment variables are configured and dependencies are installed, you can start the server with:
```bash
npm start
```
This will run the server on the port specified in the .env file (default: 4000).

To run the server in development mode (with hot-reloading using nodemon), use:
```bash
npm run dev
```

## API WebSocket Endpoints

The backend provides a set of WebSocket endpoints to interact with the system in real-time:

- Game Routes
  - `/AddUser`: Add a username to the socket connection.
  - `/createRoom`: Create a new game room.
  - `/joinRoom`: Join a game room.
  - `/opponentJoined`: Notify the opponent that you’ve joined.
  - `/sendMove`: Send chess moves to the opponent.
  - `/recieveMove`: Recieve chess moves from the opponent.
  - `/playerForfeited`: Notify the other player of a forfeit.
  - `/closeRoom`: Close the room when the game is finished.
  - `/reconnectRoom`: Reconnect to an active game
  - `/getBotMove`: Retrieve the next move from the AI bot based on the current game state.
  - `/createBotGame`: Create a new game session against an AI bot.
  - `/closeBotGame`: End an active game session against an AI bot.
  - `/moveHint`: Request a move suggestion from the AI bot to assist in decision-making.
  - `/reconnectBotGame`: Reconnect to an active game session against an AI bot.
  - `/startPuzzle`: Start a new interactive puzzle session. Returns the puzzle's FEN, moves, difficulty, and other metadata.
  - `/closePuzzle`: Mark a puzzle session as completed. Updates the database with the player's progress and time taken.
  - `/reconnectPuzzle`: Reconnect to an ongoing puzzle session. Restores the puzzle state, moves, and timer for seamless continuity.
- Chat Routes
  - `/sendGameMessage`: Send a chat message to the opponent during a game.
  - `/recieveGameMessage`: Recieve a chat message to the opponent during a game.
- Connection Routes
  - `/connect`: Establish a WebSocket connection for real-time game updates.
  - `/disconnect`: Disconnect from the WebSocket server.

## Database Structure

Below is the schema for the Firestore database used to manage user profiles, active games, and bot interactions. This structure ensures scalability and efficiency for real-time updates.

```json
{
  "users": {
    "$userID": {
      "email": "$email",                 // User's email
      "loss": "$loss",                   // Number of losses
      "elo": "$elo",                     // Elo rank of the player
      "uuid": "$uuid",                   // Universally Unique Identifier
      "username": "$username",           // User's display name
      "win": "$win",                     // Number of wins
      "draw": "$draw",                   // Number of draws
      "gamesPlayed": "$gamesPlayed",     // Number of games played by the player
      "invites": {
        "$inviteID": {
          "inviteId": "$inviteId",                 // Invitation ID
          "requestPlayerId": "$requestPlayerId",   // Requester's player ID
          "requestGameId": "$requestGameId",       // Game ID for the requester's active game
          "requestUserId": "$requestUserId",       // Requester's user ID
          "requestUsername": "$requestUsername",   // Requester's username
          "requestElo": "$requestElo"              // Requester's ELO rank
        }
      },
      "completedPuzzles": {
        "$completedPuzzleID": {
          "puzzleId": "$puzzleId",             // ID of the completed puzzle
          "completedAt": "$completedAt",       // Timestamp of when the puzzle was completed
          "difficulty": "$difficulty",         // Difficulty level ("easy", "medium", or "hard")
          "timeToComplete": "$timeToComplete"  // Time taken to complete the puzzle in seconds
        }
      },
      "lastPuzzle": {
        "easy": "$easyPuzzleNumber",           // Last completed puzzle number for easy difficulty
        "medium": "$mediumPuzzleNumber",       // Last completed puzzle number for medium difficulty
        "hard": "$hardPuzzleNumber"            // Last completed puzzle number for hard difficulty
      },
      "activePuzzle": {
        "puzzleId": "$puzzleId",               // ID of the currently active puzzle
        "difficulty": "$difficulty",           // Difficulty level of the puzzle ("easy", "medium", or "hard")
        "puzzleNumber": "$puzzleNumber",       // Sequential number of the active puzzle
        "startedAt": "$startedAt"              // Timestamp of when the puzzle was started
      }
    }
  },
  "players": {
    "$playerId": {
      "userId": "$userId",             // User ID of the player
      "username": "$username",         // Username of the player
      "elo": "$elo"                    // Elo rank of the player
    }
  },
  "games": {
    "$gameId": {                               
      "createdAt": "$createdAt",               // Timestamp of when the game was created
      "currentTurn": "$currentTurn",           // Indicates whose turn it is ("w" for white, "b" for black)
      "fen": "$fen",                           // FEN (Forsyth-Edwards Notation) string representing the board state
      "gameId": "$gameId",                     // Unique identifier for the game
      "history": ["$move1", "$move2", "..."],  // Array of moves made during the game
      "lastMoveTime": "$lastMoveTime",         // Timestamp of when the last move was made
      "playerA": {                             
        "userId": "$userId",                   // User ID of player A
        "playerId": "$playerId",               // Player ID of player A
        "username": "$username",               // Username of player A
        "elo": "$elo",                         // Elo rank of player A
        "connected": "$connected",             // Connection status of player A (true, false, or "pending")
        "orientation": "$orientation"          // Board orientation of player A ("w" or "b")
      },
      "playerB": {                             
        "userId": "$userId",                   // User ID of player B
        "playerId": "$playerId",               // Player ID of player B
        "username": "$username",               // Username of player B
        "elo": "$elo",                         // Elo rank of player B
        "connected": "$connected",             // Connection status of player B (true, false, or "pending")
        "orientation": "$orientation",         // Board orientation of player B ("w" or "b")
        "inviteId": "$inviteId"                // Optional invitation ID for player B
      },
      "status": "$status",                     // Current status of the game ("in-progress", "completed", or "waiting")
      "winner": "$winner"                      // Winner of the game ("playerA", "playerB", "draw", or null if ongoing)
    }
  },
  "botGames": {
    "$gameId": {                               
      "createdAt": "$createdAt",               // Timestamp of when the game was created
      "currentTurn": "$currentTurn",           // Indicates whose turn it is ("w" for white, "b" for black)
      "difficulty": "$difficulty",             // Indicates the bot's level of difficulty ("novice", "intermediate", "advanced", or "master")
      "fen": "$fen",                           // FEN (Forsyth-Edwards Notation) string representing the board state
      "gameId": "$gameId",                     // Unique identifier for the game
      "help": "$help",                         // Indicates the level of assistance ("assisted", "friendly", or "challenge")
      "history": ["$move1", "$move2", "..."],  // Array of moves made during the game
      "lastMoveTime": "$lastMoveTime",         // Timestamp of when the last move was made
      "playerA": {                             
        "userId": "$userId",                   // User ID of player A
        "playerId": "$playerId",               // Player ID of player A
        "username": "$username",               // Username of player A
        "elo": "$elo",                         // Elo rank of player A
        "connected": "$connected",             // Connection status of player A (true, false, or "pending")
        "orientation": "$orientation"          // Board orientation of player A ("w" or "b")
      },
      "playerB": {                             
        "userId": "$userId",                   // User ID of player B which is always the bot
        "playerId": "$playerId",               // Player ID of player B which is always the bot
        "username": "$username",               // Username of player B which is always the bot
        "elo": "$elo",                         // Elo rank of player B which is always the bot
        "connected": "$connected",             // Connection status of player B which is always true for the bot
        "orientation": "$orientation"          // Board orientation of player B ("w" or "b")
      },
      "remainingHints": "$remainingHints",     // The amount of hints left (Infinite as -1 or 0 to 3)
      "remainingUndos": "$remainingUndos",     // The amount of undos left (Infinite as -1 or 0 to 3)
      "status": "$status",                     // Current status of the game ("in-progress", "completed", or "waiting")
      "winner": "$winner"                      // Winner of the game ("playerA", "playerB", "draw", or null if ongoing)
    }
  },
  "puzzles": {
    "$puzzleID": {
      "puzzleTag": "$puzzleTag",           // Unique tag for the puzzle
      "puzzleNumber": "$puzzleNumber",     // Sequential number for the puzzle within its difficulty level
      "fen": "$fen",                       // FEN string representing the puzzle state
      "moves": ["$move1", "$move2"],       // Correct move sequence to solve the puzzle
      "rating": "$rating",                 // Rating of the puzzle
      "popularity": "$popularity",         // Popularity score of the puzzle
      "numberPlays": "$numberPlays",       // Number of times the puzzle has been played
      "themes": ["$theme1", "$theme2"],    // Themes associated with the puzzle
      "difficulty": "$difficulty"          // Difficulty level ("easy", "medium", or "hard")
    }
  }
}
```

## Future Features

Here are a few exciting features that we are planning to add:

1. **Social Platform**: Connect with friends and build your chess network. Features will include a friends list to challenge specific players, a private game feed to view completed games and puzzles, and activity updates to celebrate your friends' progress.
2. **Competition Timing**: Enhance gameplay with advanced timer options, such as classic chess clocks, time increments per move, and blitz-style controls for fast-paced matches.
3. **Live Stream**: Watch friends' games live with real-time updates. Future enhancements may include features like game highlights, real-time commentary, or reactions to key moves.
4. **Game Evaluations**: Analyze completed games move by move to identify strengths and mistakes. Features will include engine-powered AI insights, color-coded move evaluations (great moves, inaccuracies, blunders), and suggestions for improvement to help players sharpen their skills.

## Contributing

If you want to contribute to this project, feel free to open an issue or submit a pull request. Any contributions, from bug fixes to new features, are welcome!

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
