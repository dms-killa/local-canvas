// src/lib/agent/LintEvaluator.ts
export interface LintReport {
  score: number; // 0-100
  issues: string[]; // Critical problems
  warnings: string[]; // Minor problems
  metrics: {
    wordCount: number;
    lineCount: number;
    avgSentenceLength: number;
    headingCount: number;
    repeatedLines: number;
  };
}

export class LintEvaluator {
  evaluate(source: string): LintReport {
    const lines = source.split('\n').filter(line => line.trim().length > 0);
    const words = source.split(/\s+/).filter(w => w.length > 0);
    const sentences = source.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // --- Critical Issues ---
    if (source.trim().length === 0) {
      issues.push('Content is empty');
    }
    
    // Check for repeated lines (potential copy-paste errors)
    const repeatedLines = this.findRepeatedLines(lines);
    if (repeatedLines > 2) {
      issues.push(`Multiple repeated lines detected (${repeatedLines} instances)`);
    }
    
    // Check for excessively long lines
    const longLines = lines.filter(line => line.length > 200).length;
    if (longLines > 0) {
      warnings.push(`${longLines} lines exceed 200 characters`);
    }
    
    // --- Structural Checks ---
    if (words.length < 50 && words.length > 0) {
      warnings.push('Content is very short (< 50 words)');
    }
    
    if (words.length > 5000) {
      warnings.push('Content is very long (> 5000 words)');
    }
    
    // Heading structure (markdown headings)
    const headingCount = lines.filter(line => line.trim().startsWith('#')).length;
    if (headingCount === 0 && words.length > 200) {
      warnings.push('No headings found in document (consider adding structure)');
    }
    
    // Sentence length analysis
    const avgSentenceLength = sentences.length > 0 
      ? words.length / sentences.length 
      : words.length;
    
    if (avgSentenceLength > 25) {
      warnings.push(`Average sentence length is high (${avgSentenceLength.toFixed(1)} words)`);
    }
    
    // Calculate score
    const score = this.calculateScore(issues, warnings, {
      wordCount: words.length,
      lineCount: lines.length,
      avgSentenceLength,
      headingCount,
      repeatedLines
    });
    
    return {
      score,
      issues,
      warnings,
      metrics: {
        wordCount: words.length,
        lineCount: lines.length,
        avgSentenceLength,
        headingCount,
        repeatedLines
      }
    };
  }
  
  private findRepeatedLines(lines: string[]): number {
    const lineMap = new Map<string, number>();
    let repeatedCount = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length < 10) continue; // Skip short lines
      
      const count = (lineMap.get(trimmedLine) || 0) + 1;
      lineMap.set(trimmedLine, count);
      
      if (count === 2) repeatedCount++; // Count first repetition
    }
    
    return repeatedCount;
  }
  
  private calculateScore(
    issues: string[],
    warnings: string[],
    metrics: LintReport['metrics']
  ): number {
    let score = 100;
    
    // Heavy penalties for critical issues
    score -= issues.length * 25;
    
    // Moderate penalties for warnings
    score -= warnings.length * 5;
    
    // Adjust based on metrics
    if (metrics.wordCount < 10) score -= 20;
    if (metrics.headingCount === 0 && metrics.wordCount > 300) score -= 15;
    if (metrics.avgSentenceLength > 35) score -= 10;
    if (metrics.repeatedLines > 0) score -= metrics.repeatedLines * 5;
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}