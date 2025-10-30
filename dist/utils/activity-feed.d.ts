/**
 * Activity Feed
 *
 * Manages a scrolling feed of test execution events for the CLI UI.
 * Displays narrative-driven, LLM-generated descriptions of test progress.
 */
export type FeedEntryType = 'test_start' | 'test_progress' | 'eval_start' | 'test_result';
export interface FeedEntry {
    id: string;
    timestamp: Date;
    type: FeedEntryType;
    testId: string;
    agentName: string;
    dimension: string;
    data: {
        description?: string;
        progress?: string;
        result?: 'passed' | 'failed';
        score?: number;
        explanation?: string;
        failedCriterion?: string;
        runInfo?: string;
        criteriaText?: string;
        parentTestId?: string;
        runNumber?: number;
    };
}
export declare class ActivityFeed {
    private entries;
    private readonly maxEntries;
    private entryIdCounter;
    /**
     * Wrap text to fit within a maximum width
     * Returns array of lines WITHOUT adding indent (caller handles that)
     */
    private wrapText;
    /**
     * Add a new entry to the feed
     */
    addEntry(entry: Omit<FeedEntry, 'id' | 'timestamp'>): void;
    /**
     * Get recent entries (chronological order - oldest first)
     */
    getRecentEntries(count?: number): FeedEntry[];
    /**
     * Clear all entries
     */
    clear(): void;
    /**
     * Render the activity feed as formatted text
     * Simple rendering - show all recent entries, allow top to be cut off
     */
    render(width: number, height: number): string;
    /**
     * Render a single feed entry
     */
    private renderFeedEntry;
    /**
     * Format timestamp as HH:MM
     */
    private formatTimestamp;
    /**
     * Shorten test ID for display
     * e.g., "test-1234567890-1" -> "T0.1"
     */
    private shortenTestId;
}
//# sourceMappingURL=activity-feed.d.ts.map