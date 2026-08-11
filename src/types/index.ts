export type CheckStatus = 'OK' | 'WARNING' | 'CRITICAL' | 'MISSING';

export interface CheckItemResult {
  id: string;
  name: string;
  category: 'REQUIRED' | 'RECOMMENDED' | 'FORBIDDEN' | 'LARGE_FILE';
  status: CheckStatus;
  message: string;
  scoreImpact: number;
  details?: string[];
}

export interface CheckReport {
  targetPath: string;
  checkedAt: string;
  totalScore: number;
  maxScore: number;
  items: CheckItemResult[];
  unwantedFilesFound: string[];
  largeFilesFound: { path: string; sizeBytes: number }[];
  summary: {
    passedRequired: number;
    totalRequired: number;
    passedRecommended: number;
    totalRecommended: number;
    unwantedCount: number;
  };
}

export interface CheckerOptions {
  targetPath: string;
  largeFileThresholdBytes?: number; // デフォルト: 10MB (10 * 1024 * 1024)
  generateMarkdownReport?: boolean;
}
