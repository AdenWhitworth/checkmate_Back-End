import { firestore } from "../services/firebaseService";
import fs from "fs";
import csvParser from "csv-parser";
import { Puzzle } from "./processPuzzleTypes";
import path from "path";

const INPUT_FILE = path.resolve(process.cwd(), "src/puzzles/lichess_db_puzzle.csv");

/**
 * Determines the difficulty level of a chess puzzle based on its rating.
 * 
 * @param {number} rating - The rating of the puzzle.
 * @returns {'easy' | 'medium' | 'hard'} - The difficulty level ('easy', 'medium', or 'hard').
 */
const getDifficulty = (rating: number): 'easy' | 'medium' | 'hard' => {
  if (rating < 1200) return 'easy';
  if (rating <= 1999) return 'medium';
  return 'hard';
};

/**
 * Processes a batch of puzzles and uploads them to Firebase Firestore.
 * 
 * @param {Puzzle[]} batchRows - An array of puzzles to be uploaded.
 * @returns {Promise<void>} - A promise that resolves when the batch has been committed.
 */
const processBatch = async (batchRows: Puzzle[]): Promise<void> => {
  const batch = firestore.batch();

  for (const puzzle of batchRows) {
    const docRef = firestore.collection('puzzles').doc();
    batch.set(docRef, { ...puzzle, puzzleId: docRef.id });
  }

  await batch.commit();
  console.log(`Committed a batch of ${batchRows.length} documents.`);
};

/**
 * Processes a CSV file of chess puzzles and uploads them to Firebase Firestore.
 * 
 * - Reads the CSV file located at `INPUT_FILE`.
 * - Groups puzzles by difficulty ('easy', 'medium', 'hard').
 * - Limits the number of puzzles uploaded per difficulty.
 * - Uploads puzzles in batches of a specified size to Firestore.
 * 
 * @returns {Promise<void>} - A promise that resolves when all puzzles have been uploaded.
 */
export const processAndUploadPuzzles = async (): Promise<void> => {
  console.log('Processing CSV and uploading to Firebase...');

  const difficultyCounts: Record<'easy' | 'medium' | 'hard', number> = {
    easy: 0,
    medium: 0,
    hard: 0,
  };

  const MAX_PUZZLES_PER_DIFFICULTY = 1000;
  const MAX_BATCH_SIZE = 500; //Firestore max batch size is 500

  const rows: Puzzle[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(INPUT_FILE)
      .pipe(csvParser())
      .on('data', (row) => {
        try {
          const rating = parseInt(row.Rating, 10);
          const difficulty = getDifficulty(rating);

          if (difficultyCounts[difficulty] >= MAX_PUZZLES_PER_DIFFICULTY) {
            return;
          }

          const puzzle: Puzzle = {
            puzzleTag: row.PuzzleId,
            puzzleNumber: difficultyCounts[difficulty],
            fen: row.FEN,
            moves: row.Moves.split(' '),
            rating: rating,
            ratingDeviation: parseInt(row.RatingDeviation, 10),
            popularity: parseInt(row.Popularity, 10),
            numberPlays: parseInt(row.NbPlays, 10),
            themes: row.Themes.split(' '),
            openingTags: row.OpeningTags || null,
            difficulty: difficulty,
          };

          rows.push(puzzle);
          difficultyCounts[difficulty]++;

          if (rows.length >= MAX_BATCH_SIZE) {
            processBatch(rows.splice(0, MAX_BATCH_SIZE));
          }
        } catch (error) {
          console.error('Error processing row:', error);
        }
      })
      .on('end', async () => {
        try {
          if (rows.length > 0) {
            await processBatch(rows);
          }
          console.log('All puzzles uploaded to Firebase successfully!');
          console.log('Difficulty counts:', difficultyCounts);
          resolve();
        } catch (error) {
          console.error('Error committing final batch:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        reject(error);
      });
  });
};

export const addPuzzlesToExistingUsers = async (): Promise<void> => {
  try {
    console.log("Updating existing user documents...");

    const usersRef = firestore.collection("users");
    const usersSnapshot = await usersRef.get();

    const batch = firestore.batch();
    let batchSize = 0;
    const MAX_BATCH_SIZE = 500;

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();

      const updatedFields: Record<string, any> = {};

      if (!userData.lastPuzzle) {
        updatedFields.lastPuzzle = {
          easy: 0,
          medium: 0,
          hard: 0,
        };
      }

      if (Object.keys(updatedFields).length > 0) {
        batch.update(userDoc.ref, updatedFields);
        batchSize++;

        if (batchSize >= MAX_BATCH_SIZE) {
          batch.commit();
          console.log("Committed a batch of user updates.");
          batchSize = 0;
        }
      }
    });

    if (batchSize > 0) {
      await batch.commit();
      console.log("Committed the final batch of user updates.");
    }

    console.log("User updates completed successfully!");
  } catch (error) {
    console.error("Error updating user documents:", error);
  }
};