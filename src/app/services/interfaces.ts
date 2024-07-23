
import { ElementRef } from '@angular/core';

export interface GameComponentInterface {
  gameElement: ElementRef;
  sonicElement: ElementRef;
  scoreDisplay: ElementRef;
  ground: ElementRef;
  gameOverModal: ElementRef;
  finalScoreDisplay: ElementRef;
  restartButton: ElementRef;
  
  isJumping: boolean;
  score: number;
  gameSpeed: number;
  isGameOver: boolean;
  gameLoopId: number | undefined;
  maxCoins: number;
  collectedCoins: number;
  points: number;
  backgroundPosition: number;
  groundPosition: number;
  sonicFrame: number;
  sonicFrames: string[];
  cachedImages: HTMLImageElement[];
  currentSonicElement: HTMLImageElement;
  nextSonicElement: HTMLImageElement;
  animationSpeed: number;
  frameCount: number;
  flag: boolean;
  cachedNft: CachedNft;
}

export interface CachedNft {
  nft: NftResponse;
  is_active: boolean;
  lastUpdated: number;
}

export interface Skin {
  id: number;
  name: string;
  image1: string;
  image2: string;
}

export interface LeaderboardEntry {
  user_id: string;
  rank: number;
  name: string;
  score: number;
  telegram_id?: number;
  sonic_balance?: number;
  referral_count?: number;
  spent_on_nft?: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

export interface NftResponse {
  nft_id: number;
  name: string;
  max_taps: number;
  score_per_tap: number;
  price: number;
  image_uri?: string;
  in_game_points_1_level: number;
  real_money_1_level: number;
  real_money_2_level: number;
  real_money_3_level: number;
  game_max_score: number;
}

export interface UserNftResponse {
  nft: NftResponse;
  is_active: boolean;
}















// export interface GameComponentInterface {
//   gameElement: ElementRef;
//   sonicElement: ElementRef;
//   scoreDisplay: ElementRef;
//   ground: ElementRef;
//   gameOverModal: ElementRef;
//   finalScoreDisplay: ElementRef;
//   restartButton: ElementRef;
  
//   isJumping: boolean;
//   score: number;
//   gameSpeed: number;
//   isGameOver: boolean;
//   gameLoopId: number | undefined;
//   maxCoins: number;
//   collectedCoins: number;
//   points: number;
//   backgroundPosition: number;
//   groundPosition: number;
//   sonicFrame: number;
//   sonicFrames: string[];
//   cachedImages: HTMLImageElement[];
//   currentSonicElement: HTMLImageElement;
//   nextSonicElement: HTMLImageElement;
//   animationSpeed: number;
//   frameCount: number;
//   flag: boolean;
// }