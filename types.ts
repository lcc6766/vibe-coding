export interface AnalysisResult {
  text: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
}

export enum AppState {
  IDLE,
  ANALYZING,
  GENERATING,
  ERROR
}

export enum TryOnMode {
  TEXT = 'text',
  ITEM = 'item'
}
