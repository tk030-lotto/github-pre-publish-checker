type CheckStatus = 'OK' | 'WARNING' | 'CRITICAL' | 'MISSING';
interface CheckItemResult {
    id: string;
    name: string;
    category: 'REQUIRED' | 'RECOMMENDED' | 'FORBIDDEN' | 'LARGE_FILE';
    status: CheckStatus;
    message: string;
    scoreImpact: number;
    details?: string[];
}
interface CheckReport {
    targetPath: string;
    checkedAt: string;
    totalScore: number;
    maxScore: number;
    items: CheckItemResult[];
    unwantedFilesFound: string[];
    largeFilesFound: {
        path: string;
        sizeBytes: number;
    }[];
    summary: {
        passedRequired: number;
        totalRequired: number;
        passedRecommended: number;
        totalRecommended: number;
        unwantedCount: number;
    };
}
interface CheckerOptions {
    targetPath: string;
    largeFileThresholdBytes?: number;
    generateMarkdownReport?: boolean;
}

declare function runChecker(options: CheckerOptions): CheckReport;

export { runChecker };
