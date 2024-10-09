import { check, validationResult } from 'express-validator';

export const validateUsername = [
  check('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long.')
];

export const validateMove = [
  check('move')
    .notEmpty()
    .withMessage('Move cannot be empty.')
];