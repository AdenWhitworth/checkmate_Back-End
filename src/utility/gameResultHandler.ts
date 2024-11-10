import { Game } from "../controllers/socketController/CreateRoom/CreateRoomTypes";
import { admin, firestore } from "../services/firebaseService";

/**
 * Calculates the K-Factor used for updating player ratings based on their current rating and games played.
 * The K-Factor determines how much a player's rating changes after a game.
 * 
 * @param {number} rating - The current Elo rating of the player.
 * @param {number} gamesPlayed - The total number of games played by the player.
 * 
 * @returns {number} The K-Factor to be used for updating the player's rating.
 */
const calculateKFactor = (rating: number, gamesPlayed: number): number => {
  if (gamesPlayed < 5) return 45;
  if (rating <= 1000) return 32;
  if (rating <= 1600) return 20;
  return 10;
};

/**
 * Calculates the new ratings for two players after a game based on the Elo rating system.
 * Takes into account the players' current ratings, games played, and the game result.
 * 
 * @param {number} ratingA - The current Elo rating of Player A.
 * @param {number} gamesPlayedA - The total games played by Player A.
 * @param {number} ratingB - The current Elo rating of Player B.
 * @param {number} gamesPlayedB - The total games played by Player B.
 * @param {Game} game - The game object containing the game result (winner).
 * 
 * @returns {{ newRatingA: number, newRatingB: number }} The updated ratings for both players.
 */
const calculateNewRatings = (
  ratingA: number,
  gamesPlayedA: number,
  ratingB: number,
  gamesPlayedB: number,
  game: Game
): { newRatingA: number, newRatingB: number } => {
  const KA = calculateKFactor(ratingA, gamesPlayedA);
  const KB = calculateKFactor(ratingB, gamesPlayedB);
  const expectedScoreA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedScoreB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));

  let scoreA, scoreB;
  if (game.winner === 'playerA') {
    scoreA = 1;
    scoreB = 0;
  } else if (game.winner === 'playerB') {
    scoreA = 0;
    scoreB = 1;
  } else {
    scoreA = scoreB = 0.5;
  }

  const newRatingA = ratingA + KA * (scoreA - expectedScoreA);
  const newRatingB = ratingB + KB * (scoreB - expectedScoreB);

  return { newRatingA, newRatingB };
};

/**
 * Updates the game result and player ratings in Firestore after a game is completed.
 * It retrieves the game document, updates the status to 'completed', and adjusts player ratings based on the game outcome.
 * 
 * @param {Game} game - The game object containing details such as gameId, players, and the winner.
 * 
 * @throws {Error} If the game or player documents are not found, or if there is an error during the Firestore transaction.
 * 
 * @returns {Promise<void>} Resolves when the game result and player ratings are successfully updated in Firestore.
 */
export const updateGameResult = async (
  game: Game
): Promise<void> => {
  const gameRef = firestore.collection('games').doc(game.gameId);
  const playerARef = firestore.collection('players').doc(game.playerA.userId);
  const playerBRef = firestore.collection('players').doc(game.playerB.userId);

  try {
    await firestore.runTransaction(async (transaction) => {
      const gameDoc = await transaction.get(gameRef);
      if (!gameDoc.exists) throw new Error('Game not found');

      const gameData = gameDoc.data();
      if (gameData?.status === 'completed') return;

      const playerADoc = await transaction.get(playerARef);
      const playerBDoc = await transaction.get(playerBRef);

      if (!playerADoc.exists || !playerBDoc.exists) {
        throw new Error('Player not found');
      }

      const playerAData = playerADoc.data();
      const playerBData = playerBDoc.data();

      if (!gameData || !playerAData || !playerBData || !game) {
        throw new Error('Game or player data is undefined');
      }

      const ratingA = playerAData.rating ?? 1200;
      const gamesPlayedA = playerAData.gamesPlayed ?? 0;
      const ratingB = playerBData.rating ?? 1200;
      const gamesPlayedB = playerBData.gamesPlayed ?? 0;

      const { newRatingA, newRatingB } = calculateNewRatings(ratingA, gamesPlayedA, ratingB, gamesPlayedB, game);

      transaction.update(playerARef, {
        rating: newRatingA,
        gamesPlayed: admin.firestore.FieldValue.increment(1),
        ...(game.winner === "playerA" && { wins: admin.firestore.FieldValue.increment(1) }),
        ...(game.winner === "playerB" && { losses: admin.firestore.FieldValue.increment(1) }),
        ...(game.winner === "draw" && { draws: admin.firestore.FieldValue.increment(1) })
      });

      transaction.update(playerBRef, {
        rating: newRatingB,
        gamesPlayed: admin.firestore.FieldValue.increment(1),
        ...(game.winner === "playerB" && { wins: admin.firestore.FieldValue.increment(1) }),
        ...(game.winner === "playerA" && { losses: admin.firestore.FieldValue.increment(1) }),
        ...(game.winner === "draw" && { draws: admin.firestore.FieldValue.increment(1) })
      });

      transaction.update(gameRef, { status: 'completed', winner: game.winner });
    });
  } catch (error) {
    console.error('Error updating game result:', error);
    throw new Error('Failed to update game result');
  }
};

