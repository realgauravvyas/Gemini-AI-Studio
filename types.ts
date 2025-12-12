export interface GradingResult {
  score: number;
  maxScore: number;
  feedback: string;
  mistakes: string[];
  mistakeTypes: string[];
  gradingConfidence: number;
  improvements: string[];
  summary: string;
}

export interface QuestionContext {
  id: string;
  title: string;
  description: string;
  totalMarks: number;
  idealSolution?: string;
  questionImage?: {
    data: string;
    mimeType: string;
    fileName?: string;
  };
}

export interface ProcessingState {
  isConverting: boolean;
  isGrading: boolean;
  error: string | null;
}

// Ensure KaTeX is recognized on the window object
declare global {
  interface Window {
    katex: any;
  }
}