/**
 * Adaptive Column Assigner
 * Assigns columns with semantic overlap for related concepts
 */

import { ConceptRelationship } from './semantic-relationship-manager.js';

/**
 * Column assignment for a concept
 */
export interface ColumnAssignment {
  concept: string;
  columns: number[];
  baseColumns: number[];
  overlapColumns: number[];
  timestamp: number;
}

/**
 * Column usage statistics
 */
export interface ColumnUsageStats {
  columnIndex: number;
  usageCount: number;
  concepts: Set<string>;
  lastUsed: number;
}

/**
 * Assigns columns to concepts with semantic overlap
 */
export class AdaptiveColumnAssigner {
  private columnAssignments: Map<string, ColumnAssignment>;
  private columnUsage: Map<number, ColumnUsageStats>;
  private readonly totalColumns: number;
  private readonly overlapRatio: number;
  private readonly distributionSeed: number;

  constructor(
    totalColumns: number,
    overlapRatio: number = 0.3,
    distributionSeed: number = 42
  ) {
    this.totalColumns = totalColumns;
    this.overlapRatio = overlapRatio;
    this.distributionSeed = distributionSeed;
    this.columnAssignments = new Map();
    this.columnUsage = new Map();
  }

  /**
   * Assign columns with semantic overlap for related concepts
   */
  async assignColumns(
    concept: string,
    relatedConcepts: Array<{ concept: string; weight: number }>,
    baseColumnCount: number
  ): Promise<number[]> {
    // Check if already assigned
    const existing = this.columnAssignments.get(concept);
    if (existing) {
      this.updateUsageStats(existing.columns, concept);
      return existing.columns;
    }

    // Calculate column distribution
    const baseColumns = Math.floor(baseColumnCount * (1 - this.overlapRatio));
    const overlapColumns = baseColumnCount - baseColumns;

    // Generate base columns unique to this concept
    const assignedBaseColumns = this.generateBaseColumns(concept, baseColumns);
    const assignedOverlapColumns: number[] = [];

    // Add overlapping columns from related concepts
    if (relatedConcepts.length > 0 && overlapColumns > 0) {
      const overlaps = this.selectOverlapColumns(
        relatedConcepts,
        overlapColumns,
        new Set(assignedBaseColumns)
      );
      assignedOverlapColumns.push(...overlaps);
    }

    // Fill remaining columns if needed
    const totalAssigned = assignedBaseColumns.length + assignedOverlapColumns.length;
    if (totalAssigned < baseColumnCount) {
      const additional = this.generateAdditionalColumns(
        concept,
        baseColumnCount - totalAssigned,
        new Set([...assignedBaseColumns, ...assignedOverlapColumns])
      );
      assignedBaseColumns.push(...additional);
    }

    // Combine and sort columns
    const allColumns = [...assignedBaseColumns, ...assignedOverlapColumns].sort((a, b) => a - b);

    // Store assignment
    const assignment: ColumnAssignment = {
      concept,
      columns: allColumns,
      baseColumns: assignedBaseColumns,
      overlapColumns: assignedOverlapColumns,
      timestamp: Date.now()
    };
    this.columnAssignments.set(concept, assignment);

    // Update usage statistics
    this.updateUsageStats(allColumns, concept);

    return allColumns;
  }

  /**
   * Generate base columns unique to a concept
   */
  private generateBaseColumns(concept: string, count: number): number[] {
    const columns: number[] = [];
    const hash = this.stableHash(concept);
    const usedColumns = new Set<number>();

    // Use a pseudo-random but deterministic sequence
    let current = hash;
    let attempts = 0;
    const maxAttempts = count * 10;

    while (columns.length < count && attempts < maxAttempts) {
      // Generate candidate column
      current = this.nextRandom(current);
      const column = current % this.totalColumns;

      // Check if column is available or lightly used
      const usage = this.columnUsage.get(column);
      const usageCount = usage ? usage.usageCount : 0;

      // Prefer unused columns, but allow lightly used ones
      if (!usedColumns.has(column) && usageCount < 3) {
        columns.push(column);
        usedColumns.add(column);
      }

      attempts++;
    }

    // If we couldn't find enough low-usage columns, fill with any available
    if (columns.length < count) {
      current = hash + this.distributionSeed;
      for (let i = columns.length; i < count; i++) {
        current = this.nextRandom(current);
        const column = current % this.totalColumns;
        if (!usedColumns.has(column)) {
          columns.push(column);
          usedColumns.add(column);
        }
      }
    }

    return columns;
  }

  /**
   * Select overlap columns from related concepts
   */
  private selectOverlapColumns(
    relatedConcepts: Array<{ concept: string; weight: number }>,
    targetCount: number,
    excludeColumns: Set<number>
  ): number[] {
    const overlapColumns: number[] = [];
    const columnScores = new Map<number, number>();

    // Score columns based on related concept weights
    for (const { concept, weight } of relatedConcepts) {
      const assignment = this.columnAssignments.get(concept);
      if (!assignment) continue;

      // Score each column by weight and usage
      for (const column of assignment.columns) {
        if (excludeColumns.has(column)) continue;

        const currentScore = columnScores.get(column) || 0;
        const usage = this.columnUsage.get(column);
        const usagePenalty = usage ? Math.min(usage.usageCount / 10, 1) : 0;
        
        // Higher weight = more likely to share columns
        // Lower usage = preferred for sharing
        const score = weight * (1 - usagePenalty * 0.5);
        columnScores.set(column, currentScore + score);
      }
    }

    // Select highest scoring columns
    const sortedColumns = Array.from(columnScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, targetCount)
      .map(([column]) => column);

    overlapColumns.push(...sortedColumns);

    // If we need more columns, select from moderately used columns
    if (overlapColumns.length < targetCount) {
      const additionalNeeded = targetCount - overlapColumns.length;
      const candidates = this.getModeratelyUsedColumns(
        additionalNeeded * 3,
        new Set([...excludeColumns, ...overlapColumns])
      );

      // Randomly select from candidates based on related concept similarity
      const selected = this.weightedRandomSelection(
        candidates,
        additionalNeeded,
        relatedConcepts[0]?.concept || ''
      );

      overlapColumns.push(...selected);
    }

    return overlapColumns;
  }

  /**
   * Generate additional columns to fill the quota
   */
  private generateAdditionalColumns(
    concept: string,
    count: number,
    excludeColumns: Set<number>
  ): number[] {
    const columns: number[] = [];
    const hash = this.stableHash(concept + '_additional');
    let current = hash;

    for (let i = 0; i < count * 10 && columns.length < count; i++) {
      current = this.nextRandom(current);
      const column = current % this.totalColumns;

      if (!excludeColumns.has(column) && !columns.includes(column)) {
        columns.push(column);
        excludeColumns.add(column);
      }
    }

    return columns;
  }

  /**
   * Get moderately used columns
   */
  private getModeratelyUsedColumns(
    count: number,
    excludeColumns: Set<number>
  ): number[] {
    const candidates: Array<{ column: number; usage: number }> = [];

    for (let i = 0; i < this.totalColumns; i++) {
      if (excludeColumns.has(i)) continue;

      const usage = this.columnUsage.get(i);
      const usageCount = usage ? usage.usageCount : 0;

      // Prefer columns with moderate usage (1-5)
      if (usageCount >= 1 && usageCount <= 5) {
        candidates.push({ column: i, usage: usageCount });
      }
    }

    // Sort by usage (prefer lower usage)
    candidates.sort((a, b) => a.usage - b.usage);

    return candidates.slice(0, count).map(c => c.column);
  }

  /**
   * Weighted random selection of columns
   */
  private weightedRandomSelection(
    candidates: number[],
    count: number,
    seed: string
  ): number[] {
    if (candidates.length <= count) {
      return candidates;
    }

    const selected: number[] = [];
    const hash = this.stableHash(seed);
    let current = hash;

    const shuffled = [...candidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
      current = this.nextRandom(current);
      const j = current % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count);
  }

  /**
   * Update usage statistics for columns
   */
  private updateUsageStats(columns: number[], concept: string): void {
    const now = Date.now();

    for (const column of columns) {
      if (!this.columnUsage.has(column)) {
        this.columnUsage.set(column, {
          columnIndex: column,
          usageCount: 0,
          concepts: new Set(),
          lastUsed: now
        });
      }

      const stats = this.columnUsage.get(column)!;
      stats.usageCount++;
      stats.concepts.add(concept);
      stats.lastUsed = now;
    }
  }

  /**
   * Get column distribution statistics
   */
  getColumnDistributionStats(): {
    totalAssignments: number;
    averageColumnsPerConcept: number;
    columnUtilization: number;
    overlapRatio: number;
    usageHistogram: Map<number, number>;
  } {
    const assignments = Array.from(this.columnAssignments.values());
    const totalColumns = assignments.reduce((sum, a) => sum + a.columns.length, 0);
    const totalOverlapColumns = assignments.reduce((sum, a) => sum + a.overlapColumns.length, 0);

    // Create usage histogram
    const usageHistogram = new Map<number, number>();
    for (const stats of this.columnUsage.values()) {
      const usage = stats.usageCount;
      usageHistogram.set(usage, (usageHistogram.get(usage) || 0) + 1);
    }

    return {
      totalAssignments: assignments.length,
      averageColumnsPerConcept: assignments.length > 0 ? totalColumns / assignments.length : 0,
      columnUtilization: this.columnUsage.size / this.totalColumns,
      overlapRatio: totalColumns > 0 ? totalOverlapColumns / totalColumns : 0,
      usageHistogram
    };
  }

  /**
   * Get concepts sharing columns with a given concept
   */
  getOverlappingConcepts(concept: string): Array<{ concept: string; sharedColumns: number }> {
    const assignment = this.columnAssignments.get(concept);
    if (!assignment) return [];

    const conceptColumns = new Set(assignment.columns);
    const overlaps = new Map<string, number>();

    // Check all other assignments
    for (const [otherConcept, otherAssignment] of this.columnAssignments.entries()) {
      if (otherConcept === concept) continue;

      let sharedCount = 0;
      for (const column of otherAssignment.columns) {
        if (conceptColumns.has(column)) {
          sharedCount++;
        }
      }

      if (sharedCount > 0) {
        overlaps.set(otherConcept, sharedCount);
      }
    }

    return Array.from(overlaps.entries())
      .map(([concept, sharedColumns]) => ({ concept, sharedColumns }))
      .sort((a, b) => b.sharedColumns - a.sharedColumns);
  }

  /**
   * Stable hash function
   */
  private stableHash(str: string): number {
    let hash = this.distributionSeed;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Linear congruential generator for deterministic randomness
   */
  private nextRandom(seed: number): number {
    return (seed * 1664525 + 1013904223) & 0x7fffffff;
  }

  /**
   * Clear all assignments
   */
  clear() {
    this.columnAssignments.clear();
    this.columnUsage.clear();
  }

  /**
   * Export assignments for debugging
   */
  exportAssignments(): Array<{
    concept: string;
    totalColumns: number;
    baseColumns: number;
    overlapColumns: number;
    overlappingWith: string[];
  }> {
    return Array.from(this.columnAssignments.entries()).map(([concept, assignment]) => {
      const overlapping = this.getOverlappingConcepts(concept)
        .map(o => o.concept)
        .slice(0, 5);

      return {
        concept,
        totalColumns: assignment.columns.length,
        baseColumns: assignment.baseColumns.length,
        overlapColumns: assignment.overlapColumns.length,
        overlappingWith: overlapping
      };
    });
  }
}
