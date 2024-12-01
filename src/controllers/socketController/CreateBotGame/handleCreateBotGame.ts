import { v4 as uuidV4 } from "uuid";
import { Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { admin, firestore } from "../../../services/firebaseService";
import { CreateBotGameArgs, BotGame } from "./CreateBotGameTypes";

/**
 * Handles the creation of a new bot game by validating input, generating game data,
 * saving the game to Firestore, and linking the game to the user in the database.
 *
 * @param {Socket} socket - The socket instance representing the connected user.
 * @param {CreateBotGameArgs} createBotGameArgs - Arguments required to create a bot game.
 * @param {Function} callback - The callback function to return the result of the operation.
 * @returns {Promise<void>} Resolves when the bot game is successfully created.
 * @throws {Error} Will throw an error if any required arguments or conditions are invalid.
 */
export const handleCreateBotGame = async (
  socket: Socket,
  createBotGameArgs: CreateBotGameArgs,
  callback: Function,
): Promise<void> => {
  try {
    if (!createBotGameArgs.playerA || !createBotGameArgs.playerB) throw Error("Missing player arguments");
    if (!createBotGameArgs.difficulty || !createBotGameArgs.help) throw Error("Missing bot settings");
    if (!socket.data.username || !socket.data.userId) throw Error("Socket username and userId required.");

    const botGameId = uuidV4();
    const botGameRef = firestore.collection('botGames').doc(botGameId);
    const userRef = firestore.collection('users').doc(socket.data.userId);

    const botGameDoc = await botGameRef.get();
    if (botGameDoc.exists) {
      throw new Error("Game with this ID already exists.");
    }

    const helpSettings = {
      assisted: -1,
      friendly: 3,
      challenge: 0
    };

    const initialBotGameData: BotGame = {
        gameId: botGameId,
        playerA: {
            userId: createBotGameArgs.playerA.userId,
            playerId: createBotGameArgs.playerA.playerId,
            username: createBotGameArgs.playerA.username,
            elo: createBotGameArgs.playerA.elo,
            orientation: createBotGameArgs.playerA.orientation,
            connected: true,
        },
        playerB: {
            userId: createBotGameArgs.playerB.userId,
            playerId: createBotGameArgs.playerB.playerId,
            username: createBotGameArgs.playerB.username,
            elo: createBotGameArgs.playerB.elo,
            orientation: createBotGameArgs.playerA.orientation,
            connected: true,
        },
        fen: "start",
        history: [],
        currentTurn: "w",
        status: "in-progress",
        winner: null,
        lastMoveTime: admin.firestore.Timestamp.now(),
        createdAt: admin.firestore.Timestamp.now(),
        difficulty: createBotGameArgs.difficulty,
        help: createBotGameArgs.help,
        remainingUndos: helpSettings[createBotGameArgs.help],
        remainingHints: helpSettings[createBotGameArgs.help],
    };

    await firestore.runTransaction(async (transaction) => {
      const botGameDoc = await transaction.get(botGameRef);
      if (botGameDoc.exists) {
        throw new Error("Game with this ID already exists.");
      }

      transaction.set(botGameRef, initialBotGameData);
      transaction.update(userRef, { currentBotGameId: botGameId })
    });

    handleCallback(callback, false, "Game successfully created", { botGame: initialBotGameData});
  } catch (error) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};