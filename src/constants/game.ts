export const GAME_CONFIG = {
  // Lives
  INITIAL_LIVES: 3,
  
  // Timer (in seconds)
  TIMER_DURATION: 120, // 2 minutes
  
  // Hints
  MAX_HINTS: 2,
  HINT_TIME_PENALTY: 10, // seconds
  
  // Options
  OPTIONS_PER_STEP: 4,
  
  // Scoring
  BASE_SCORE: 1000,
  PENALTY_PER_EXTRA_STEP: 100,
  PENALTY_PER_LIFE_LOST: 150,
  PENALTY_PER_HINT: 50,
  TIME_BONUS_THRESHOLD: 60, // seconds - bonus if completed under this
  TIME_BONUS_AMOUNT: 100,
  
  // Path limits
  MAX_PATH_LENGTH: 6, // Six degrees
} as const;

export type GameConfig = typeof GAME_CONFIG;
