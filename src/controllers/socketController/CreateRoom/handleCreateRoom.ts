import { v4 as uuidV4 } from "uuid";
import { Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { admin, firestore } from "../../../services/firebaseService";
import { Game, CreateRoomArgs } from "./CreateRoomTypes";

/**
 * Handles the creation of a new game room by generating a unique game ID, joining the socket to the room,
 * and storing the game information in Firestore. This function also initializes the game state and sets up 
 * both players (playerA as the creator and playerB as the opponent).
 * 
 * @param {Socket} socket - The Socket.IO socket instance representing the connected client.
 *        The socket is used to join the room and store relevant user data.
 * 
 * @param {Function} callback - A callback function to be executed once the operation is complete. 
 *        The callback receives three arguments: 
 *        - an error flag (`boolean`),
 *        - a message (`string`),
 *        - an object containing the details of the created game (`{ game: Game }`).
 * 
 * @param {CreateRoomArgs} createRoomArgs - An object containing information about the players who are creating the game.
 *        - `playerA`: The player who creates the game (creator).
 *        - `playerB`: The player who will join the game as an opponent.
 * 
 * @throws {Error} If the socket does not have `username` or `userId` set in its data, or if the player arguments are missing.
 * 
 * @returns {Promise<void>} Resolves when the room is successfully created and the game data is stored in Firestore, 
 *          or an error is handled.
 */
export const handleCreateRoom = async (
  socket: Socket,
  createRoomArgs: CreateRoomArgs,
  callback: Function,
): Promise<void> => {
  try {
    if (!socket.data.username || !socket.data.userId) throw Error("Socket username and userId required.");
    if (!createRoomArgs.playerA || !createRoomArgs.playerB) throw Error("Missing player arguments");

    const gameId = uuidV4();
    const gameRef = firestore.collection('games').doc(gameId);

    const gameDoc = await gameRef.get();
    if (gameDoc.exists) {
      throw new Error("Game with this ID already exists.");
    }

    socket.data.gameId = gameId;
    await socket.join(gameId);

    const initialGameData: Game = {
      gameId,
      playerA: {
        userId: createRoomArgs.playerA.userId,
        username: createRoomArgs.playerA.username,
        elo: createRoomArgs.playerA.elo,
        connected: true,
      },
      playerB: {
        userId: createRoomArgs.playerB.userId,
        username: createRoomArgs.playerB.username,
        elo: createRoomArgs.playerB.elo,
        connected: false,
      },
      boardState: [],
      moveHistory: [],
      currentTurn: "playerA",
      status: "in-progress",
      winner: null,
      lastMoveTime: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.Timestamp.now(),
    };

    await gameRef.set(initialGameData);

    handleCallback(callback, false, "Game successfully created", { game: initialGameData});
  } catch (error) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};

