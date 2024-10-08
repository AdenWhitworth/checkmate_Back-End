<img width="80" src="https://github.com/AdenWhitworth/online_chess_with_friends_Front-End/raw/master/src/Images/King%20Logo%20Black.svg" alt="Online Chess With Friends Logo">

# Online Chess With Friends Back-End

Welcome to the **Online Chess With Friends Back-End**, the API for the Online Chess With Friends game. This backend controls all active chess games, user authentication, chat, and ranking systems.

## Table of Contents
- [Overview](#overview)
- [Online Chess With Friends Live Demo](#online-chess-with-friends-live-demo)
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

**Online Chess With Friends** is an application that enables players to compete in real-time chess matches, communicate with opponents, and track their rankings. The backend, built with Node.js and WebSocket, manages all server-side logic, ensuring a smooth, responsive gameplay experience.

## Online Chess With Friends Live Demo

The Online Chess With Friends application is live and can be accessed here: [Online Chess With Friends Demo](https://online-chess-with-friends.web.app/). You can explore all features of the game, including real-time gameplay, chat, and rankings.

### Test User Credentials

Try out the app using the following demo accounts:

- **Emails:** demo1@gmail.com & demo2@gmail.com
- **Password:** PortfolioDemo1!

>**Note**: You can even play against yourself by opening the application in two separate browser windows.

## Features

- **WebSocket-Based Real-Time Gameplay**: Engage in real-time chess games with your friends using WebSocket-based updates for a seamless experience.
- **User Authentication & Authorization**: Handle secure login, registration, and user management with JWT-based authentication.
- **Matchmaking & Game Room Management**: Create, join, and manage game rooms, making it easy to start games with friends.
- **Player Stats & Ranking System**: Track player performance and compare rankings with friends, updating results in real-time.
- **In-Game Chat Support**: Use real-time chat to communicate with your opponent during matches.

## Technologies Used

- **Node.js**: Backend runtime environment for executing JavaScript on the server.
- **Express.js**: Web framework for building the RESTful API.
- **JWT (JSON Web Tokens)**: Used for secure authentication.
- **Socket.IO**: A library that facilitates real-time, bidirectional communication between clients and servers, crucial for features like live updates and notifications.
- **uuid.js**: A library used to generate unique identifiers (UUIDs), essential for creating distinct and secure references for users, games, and various entities in web applications.
- **Firebase**:
  - **Authentication**: Provides secure sign-in via various methods, including email/password, Google, etc.
  - **Admin**: Firebase Admin SDK is used for server-side operations like managing users, securely accessing Firebase databases, and performing other privileged tasks such as setting up custom claims for user roles and managing user accounts programmatically.

## Getting Started

Follow the instructions below to set up the project on your local machine.

### Prerequisites

Make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AdenWhitworth/online_chess_with_friends_Front-End.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables
Create a `.env` file in the root directory and define the following variables:

  ```plain text
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
3. Set Up Firebase Authentication
  - In the Firebase Console, navigate to Firestore Database and create your database. Add collections for users, games, etc.
4. Set Up Firestore Database:
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
  - `/username`: Add a username to the socket connection.
  - `/createRoom`: Create a new game room.
  - `/joinRoom`: Join a game room.
  - `/opponentJoined`: Notify the opponent that you’ve joined.
  - `/move`: Send chess moves to the opponent.
  - `/playerForfeited`: Notify the other player of a forfeit.
  - `/closeRoom`: Close the room when the game is finished.
- Chat Routes
  - `/sendGameMessage`: Send a chat message to the opponent during a game.
- Connection Routes
  - `/connect`: Establish a WebSocket connection for real-time game updates.
  - `/disconnect`: Disconnect from the WebSocket server.

## Database Structure

The application uses Firebase Firestore to store user data and game information. Below is the structure of the **users** and **players** collections:

```json
{
  "users": {
    "$userID": {
      "email": "$email",             // User's email
      "loss": "$loss",               // Number of losses
      "playerID": "$playerID",       // Player's unique ID
      "rank": "$rank",               // Player's rank
      "uuid": "$uuid",               // Universally Unique Identifier
      "username": "$username",       // User's display name
      "win": "$win",                 // Number of wins
      "invites": {
        "$inviteID": {
          "requestLoss": "$requestLoss",           // Requester's loss count
          "requestPlayerID": "$requestPlayerID",   // Requester's player ID
          "requestRoom": "$requestRoom",           // Room associated with the request
          "requestUserID": "$requestUserID",       // Requester's user ID
          "requestUserName": "$requestUserName",   // Requester's username
          "requestWin": "$requestWin"              // Requester's win count
        }
      }
    }
  },
  "players": {
    "$playerID": {
      "userID": "$userID",             // User ID of the player
      "username": "$username"          // Username of the player
    }
  }
}
```

## Future Features

Here are a few exciting features that we are planning to add:

1. **Solo Practice**: Implement AI opponents for solo play.
2. **Competition Timing**: Add a timer feature for each game to enhance competitive gameplay.
3. **Live Stream**: Enable real-time streaming of friends' games so you can watch matches live.

## Contributing

If you want to contribute to this project, feel free to open an issue or submit a pull request. Any contributions, from bug fixes to new features, are welcome!

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
