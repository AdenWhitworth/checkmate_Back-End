var admin = require("firebase-admin");
var serviceAccount = require("./.firebase/service-account.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});//Initialize Firebase Admin
const express = require('express');
const { Server } = require("socket.io");
const { v4: uuidV4 } = require('uuid');
const http = require('http');

const app = express(); // Initialize express

const server = http.createServer(app);

const rooms = new Map();//global rooms variable to track all rooms created with socket

// set port to value received from environment variable or 8080 if null
const port = process.env.PORT || 8080 

// upgrade http server to websocket server
const io = new Server(server, {
  cors: '*', // allow connection from any origin
});


// io.use
// This is middleware function
// Going to check that the socket is a user who is signed in
io.use( async (socket, next) => {
  
  const token = socket.handshake.auth.token;//Get the firebase token passed from the front-end

  try{//try to varify token with firebase
    const decodedIdToken = await admin.auth().verifyIdToken(token);//use auth admin to verify if the token is active for a player
    next();//let io connection continue
  } catch (error) {//if error do not allow connection
    const err = new Error("not authorized");
    err.data = { content: error };
    next(err);//do not let io connection continue
  }

});

// io.connection
// Process initial connection after middleware has been run
io.on('connection', (socket) => {
  
    //username
    socket.on('username', async (username, callback) => {
      let error, message;
      try{
        socket.data.username = username;//under this socket connections data, create a username 
        error = false;
        message = "added username";
        callback({error,message}); //send callback to client showing success adding username to socket
      } catch (e){//if username is not stored, then pass an error to client
        error = true;
        message = e;
        callback({error,message});//send callback to client showing error adding username to socket
      }
      
    });
  
    //createRoom
    socket.on('createRoom', async (callback) => { // callback here refers to the callback function from the client passed as data
      let error, message;
      try {//try to create the room
        const roomId = uuidV4(); //create a new uuid
        await socket.join(roomId); //make creating user join the room
      
        // set roomId as a key and roomData including players as value in the map
        rooms.set(roomId, {
          roomId,
          players: [{ id: socket.id, username: socket.data?.username }]
        });

        error = false;
        message = "created room";
    
        callback({error,message,roomId}); //send callback to client showing the created roomId and no error 
      } catch (e){//if room is not created, then pass an error to client

        error = true;
        message = e;

        callback({error,message});//send callback to client showing an error creating the room
      }
    });

    //joinRoom
    socket.on('joinRoom', async (args, callback) => {
      let error, message;
      try{
        // check if room exists and it has a player waiting
        const room = rooms.get(args.roomId);
      
        if (!room) { // if room does not exist
          error = true;
          message = 'room does not exist';
        } else if (room.length <= 0) { // if room is empty set appropriate message
          error = true;
          message = 'room is empty';
        } else if (room.length >= 2) { // if room is full
          error = true;
          message = 'room is full'; // set message to 'room is full'
        }
    
        if (error) {
          //if there is an error based on the room check then stop the connection and send an error to the client
          callback({error,message});//send callback to client showing an error joining the room.
          return;// stop any the player from joining the room
        }
    
        await socket.join(args.roomId); // make the joining client join the room
    
        // add the joining user's data to the list of players in the room
        const roomUpdate = {
          ...room,
          players: [
            ...room.players,
            { id: socket.id, username: socket.data?.username },
          ],
        };
    
        rooms.set(args.roomId, roomUpdate);
        
        let RoomUpdate = roomUpdate;
        error = false;
        message = "success joining room";

        // emit an 'opponentJoined' event to the other player in the room letting them know the opponent has joined
        socket.timeout(1000).broadcast.to(args.roomId).emit('opponentJoined', {RoomUpdate, error, message}, (err,response) => {
          if (err){//If the client recieving this emit return an error, then stop this player from joining the room
            error = true;
            message = "Error Emitting Opponent Joining";

            callback({error,message});//send callback to client showing an error on the player joining emit
            
          }else {
            callback({RoomUpdate,error,message}); //send callback to client with the room details
          }

        });

      } catch (e){//if room is not created, then pass an error to client
        error = true;
        message = err;

        callback({error,message});//send callback to client with the error joining the room
      }
    });

    //move
    socket.on('move', (data, callback) => {
      let error,message;
      try{
        // emit the move to all sockets in the room except the emitting socket that a move has been made
        socket.timeout(1000).broadcast.to(data.room).emit('move', data.move, (err,response) =>{
          if (err){//if there is an error emiting this to the other client, then send an error back to original socket client
            error = true;
            message = response.error;
            callback({error,message});//send callback to client with an error moving the piece
          } else {
            error = false;
            message = "move made for both players";
            callback({error,message});//send callback to client with no error while moving the piece
          }
        });
      } catch (e){//if a move is not made, then pass an error to client
        error = true;
        message = e;
        callback({error,message});//send callback to client with an error moving the piece
      }
      
    });

    //disconnect
    socket.on("disconnect", () => {
      let error, message;
      try {
        const gameRooms = Array.from(rooms.values());//create an array of all the active gamerooms based on Id's
        
        //iterating through each room, the player id's within that room are compared to the socket id of the player disconnecting
        //this allows for the user info on the player leaving the room to be send to the other player in the room
        gameRooms.forEach((room) => {
          const userInRoom = room.players.find((player) => player.id === socket.id);
    
          if (userInRoom) {//only proceed with emiting the disconnect if there are other players in the room
            //emit to all sockets in the room except the emitting socket that a player disconnected
            socket.broadcast.to(room.roomId).emit("playerDisconnected", userInRoom);
          }
        });
      } catch (e){//No callback for the disconnect so error is just logged
        error = true;
        message = e;
      }
    });

    //playerForfeited
    socket.on("playerForfeited", async (data, callback) => {
      let error,message;
      try {
        //emit to all sockets in the room except the emitting socket that a player forfeited
        socket.timeout(1000).broadcast.to(data.roomId).emit("playerForfeited", data, (err, response) => {
          if (err){
            error = true;
            message = response.message;

            callback({error,message});//send callback to client with an error while trying to forfeit

          } else {
            error = false;
            message = "player recieved forfeit";

            callback({error,message});//send callback to client with no error while trying to forfeit
          }
        });
         
      } catch(e) {
        error = true;
        message = e;

        callback({error,message});//send callback to client with an error while trying to forfeit
      }
    });

    //closeRoom
    socket.on("closeRoom", async (data, callback) => {
      let error,message;
      try{
        const clientSockets = await io.in(data.roomId).fetchSockets(); //get all sockets in the room passed in the data object
    
        // loop over each client socket
        clientSockets.forEach((s) => {
          s.leave(data.roomId); //make each socket leave the socket room
        });
    
        rooms.delete(data.roomId); //delete room from rooms map

        error = false;
        message = "Room Closed";
        callback({error,message})//send callback to client that the room was successfully closed 

      } catch (e){//if there is an error closing the room, then pass this to client
        error = true;
        message = e;

        callback({error,message});//send callback to client that there was an error closing the room
      }
    });
});

// io.connection
server.listen(port, () => {
  console.log(`listening on *:${port}`);
});