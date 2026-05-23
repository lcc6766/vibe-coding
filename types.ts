
export interface AnalysisResult {
  text: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
}

export interface OutfitAnalysis {
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  analysisText: string;
  suggestedPrompt: string;
}

export interface StyleRecommendation {
  id: string;
  styleName: string;
  description: string;
  matchAdvice: string;
  visualPrompt: string; // Internal prompt for the image generator
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

export interface PersonalizedStyleAnalysis {
  suitabilityExplanation: string;
  suitabilityScore: number;
  recommendedStyles: {
    name: string;
    reason: string;
  }[];
  recommendedBrands: string[];
  visualPrompt: string;
}

export enum Workflow {
  PERSON = 'person', // Upload user photo
  ITEM = 'item',      // Upload garment only
  ADVISOR = 'advisor'  // Personalized style advisor
}

export type Gender = 'female' | 'male';
