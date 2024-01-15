# Online Chess With Friends
> A real-time online competitive chess game where you are able to challenge your friends.

Create an account and invite your friends to play a game. View the global leader board to see where you stand. To demo the game without creating an account, please sign in with the below demo accounts. Using two separate browser windows, you can even play against yourself.

Emails: demo1@gmail.com & demo2@gmail.com

Password: PortfolioDemo1!

[See Live Demo](https://online-chess-with-friends.web.app/)

This repository is just for the back-end. Use the link below to access the front end repository for this game. 

[See Front-End](https://github.com/AdenWhitworth/online_chess_with_friends)

## Features
- Create a socket server
- Socket server listening on hosted port
- Handle initial socket connection 
- Handle connect player username
- Handle room creation
- Handle opponent joining the room
- Handle chess piece move
- Handle player disconnect
- Handle closing the room

## Back-End Technology Stack
- Node.js
- JavaScript
- Express
- Socket.io
- http.js
- uuid.js

## Design Process & Considerations

### Server Creation
To initialize the backend server,  I started with initializing an instance of express and by creating an environmental port. Using the http framework, I created an http server from the express app previously initialized. Now that the http server has been created, I then listen to this server on the designated port for any updates. The last step was to initialize the socket connection through upgrading the http server to a web socket server. For later use, I initialized a global rooms map to later be filled with all of the active game rooms.

### Socket Connections:

#### Web socket server 
Using the upgraded web socket server, I created an on connection instance. This instance initializes each player joining the socket, and allows each players socket to be handled separately. 

#### Socket.on 'username'
Using the individual players socket connection, a socket.on method is used to add the username sent from the front-end to a data object for the individual players socket connection. 

#### Socket.on 'createRoom'
Using the individual players socket connection, a socket.on method is used create a game room. This socket connection is asynchronous and will provide a callback for the front end to receive. By using the uuid API, I am able to create a unique room id for each game. I then use the socket join API function to have this player join the room with the unique id I just created. With the JS set function, I add the socket id and username of the user creating the room to the rooms map global variable created earlier. Using the socket callback function, I send the room id associated with the player who created the room back to the front end for later use. 

#### Socket.on 'joinRoom'
The purpose of this socket method is to add the second player to the already created room by the first player. The front-end will have already distributed the room unique id to the player joining the game and will be an input argument for this socket.on. The first step in having this player join the room is to take the input room id from the front end and do a JS get function to retrieve the room data from the back-end global map data. If the room does not exist, then an error message is sent back to the front-end with the socket callback. If the room exists and only one player is in that room, then I allow for another socket join API function to be called in order to have the second player join the socket room. After successfully joining the room, the rooms global variable is updated to show two players in room. A callback is sent to the player joining the room to show that it was successful, and a socket emit to the first player in the room is done to alert them that the second player has successfully joined their game. 

#### Socket.on 'move'
As a game is going on, this socket method is used to update the opponents chessboard so that all moves are captured by both players. The input argument for this method does not need manipulation as the front-end has already formatted it with the necessary information needed to update the chessboard. Taking the input data, a socket emit is sent to the players in the room containing the most recent chess piece move data. 

#### Socket.on 'disconnect'
When a player's front-end becomes disconnected from the back-end socket, this socket disconnect method is called. To see which room the player disconnected from, I first created an array of all the rooms found in the global rooms map. With this new array, I iterated through each room to find the room where one of the players ids matches the id of the socket being disconnected from. Once the room is found, I checked to make sure there are two players shown in the room data and socket emit to the room that a player has disconnected. The front-end will use this socket emit to later close the room. 

#### Socket.on 'closeRoom'
This socket method is used by the front-end for when a player forfeits or for when a player disconnects from the game. When this is triggered, the first this to do is notify the other player in the room that it the room is being deleted and closed. Using the fetchSockets API function, I look for all of the sockets in the room with the id which is passed in the input arguments. For all of the sockets in this room, I use the leave API function to have each player leave the game. Once all players are removed from the socket room, the room is deleted from the global rooms map. 

## Future Features
- Add Authentication middleware :heavy_check_mark: (feature/1)
- Add in game chat between players
- Add custom A.I. bot to practice against
- Add watch active game functionality
