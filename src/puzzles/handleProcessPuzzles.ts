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
    const docRef = firestore.collection('puzzles').doc(puzzle.PuzzleId);
    batch.set(docRef, puzzle);
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

  const puzzlesRef = firestore.collection('puzzles');
  const difficultyCounts: Record<'easy' | 'medium' | 'hard', number> = {
    easy: 0,
    medium: 0,
    hard: 0,
  };

  const MAX_PUZZLES_PER_DIFFICULTY = 4;
  const MAX_BATCH_SIZE = 2; //Firestore max batch size is 500

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
            PuzzleId: row.PuzzleId,
            FEN: row.FEN,
            Moves: row.Moves.split(' '),
            Rating: rating,
            RatingDeviation: parseInt(row.RatingDeviation, 10),
            Popularity: parseInt(row.Popularity, 10),
            NbPlays: parseInt(row.NbPlays, 10),
            Themes: row.Themes.split(' '),
            GameUrl: row.GameUrl,
            OpeningTags: row.OpeningTags || null,
            Difficulty: difficulty,
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
