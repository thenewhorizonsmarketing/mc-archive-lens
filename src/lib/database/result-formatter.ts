// Result Formatter for search results
import {
  SearchResult,
  AlumniResult,
  PublicationResult,
  PhotoResult,
  FacultyResult
} from './types';

export interface FormattingOptions {
  includeSnippets?: boolean;
  snippetLength?: number;
  highlightTerms?: string[];
  includeThumbnails?: boolean;
  thumbnailSize?: 'small' | 'medium' | 'large';
  includeMetadata?: boolean;
}

export interface FormattedResult extends SearchResult {
  snippet?: string;
  highlightedTitle?: string;
  highlightedSubtitle?: string;
  metadata?: Record<string, any>;
  thumbnailUrl?: string;
  detailUrl?: string;
}

export class ResultFormatter {
  /**
   * Format search results for display
   */
  static formatResults(
    results: SearchResult[],
    options: FormattingOptions = {}
  ): FormattedResult[] {
    const {
      includeSnippets = true,
      snippetLength = 150,
      highlightTerms = [],
      includeThumbnails = true,
      includeMetadata = true
    } = options;

    return results.map(result => {
      const formatted: FormattedResult = { ...result };

      // Add snippets
      if (includeSnippets) {
        formatted.snippet = this.generateSnippet(result, snippetLength, highlightTerms);
      }

      // Add highlighting
      if (highlightTerms.length > 0) {
        formatted.highlightedTitle = this.highlightText(result.title, highlightTerms);
        if (result.subtitle) {
          formatted.highlightedSubtitle = this.highlightText(result.subtitle, highlightTerms);
        }
      }

      // Add thumbnails
      if (includeThumbnails && result.thumbnailPath) {
        formatted.thumbnailUrl = this.resolveThumbnailUrl(result.thumbnailPath, options.thumbnailSize);
      }

      // Add metadata
      if (includeMetadata) {
        formatted.metadata = this.extractMetadata(result);
      }

      // Add detail URL
      formatted.detailUrl = this.generateDetailUrl(result);

      return formatted;
    });
  }

  /**
   * Format result for card display
   */
  static formatForCard(result: SearchResult, highlightTerms: string[] = []): {
    title: string;
    subtitle: string;
    snippet: string;
    thumbnailUrl?: string;
    badges: string[];
    metadata: Array<{ label: string; value: string }>;
  } {
    const snippet = this.generateSnippet(result, 100, highlightTerms);
    const badges = this.generateBadges(result);
    const metadata = this.generateCardMetadata(result);

    return {
      title: highlightTerms.length > 0 ? this.highlightText(result.title, highlightTerms) : result.title,
      subtitle: result.subtitle || '',
      snippet,
      thumbnailUrl: result.thumbnailPath ? this.resolveThumbnailUrl(result.thumbnailPath, 'medium') : undefined,
      badges,
      metadata
    };
  }

  /**
   * Format result for list display
   */
  static formatForList(result: SearchResult, highlightTerms: string[] = []): {
    title: string;
    subtitle: string;
    snippet: string;
    icon: string;
    metadata: string[];
  } {
    const snippet = this.generateSnippet(result, 200, highlightTerms);
    const icon = this.getTypeIcon(result.type);
    const metadata = this.generateListMetadata(result);

    return {
      title: highlightTerms.length > 0 ? this.highlightText(result.title, highlightTerms) : result.title,
      subtitle: result.subtitle || '',
      snippet,
      icon,
      metadata
    };
  }

  /**
   * Format results for export
   */
  static formatForExport(results: SearchResult[], format: 'csv' | 'json' | 'xml' = 'json'): string {
    switch (format) {
      case 'csv':
        return this.formatAsCSV(results);
      case 'xml':
        return this.formatAsXML(results);
      case 'json':
      default:
        return this.formatAsJSON(results);
    }
  }

  /**
   * Generate search result summary
   */
  static generateSummary(results: SearchResult[]): {
    totalResults: number;
    resultsByType: Record<string, number>;
    topTags: Array<{ tag: string; count: number }>;
    yearRange?: { start: number; end: number };
  } {
    const totalResults = results.length;
    const resultsByType: Record<string, number> = {};
    const tagCounts = new Map<string, number>();
    const years: number[] = [];

    results.forEach(result => {
      // Count by type
      resultsByType[result.type] = (resultsByType[result.type] || 0) + 1;

      // Extract tags
      const tags = this.extractTags(result);
      tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });

      // Extract years
      const year = this.extractYear(result);
      if (year) {
        years.push(year);
      }
    });

    // Top tags
    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Year range
    const yearRange = years.length > 0 ? {
      start: Math.min(...years),
      end: Math.max(...years)
    } : undefined;

    return {
      totalResults,
      resultsByType,
      topTags,
      yearRange
    };
  }

  // Private helper methods

  private static generateSnippet(
    result: SearchResult,
    maxLength: number,
    highlightTerms: string[]
  ): string {
    let content = '';

    // Extract content based on result type
    switch (result.type) {
      case 'alumni':
        const alumniResult = result as AlumniResult;
        content = [
          alumniResult.data.caption,
          alumniResult.data.role,
          `Class of ${alumniResult.data.class_year}`
        ].filter(Boolean).join(' • ');
        break;

      case 'publication':
        const pubResult = result as PublicationResult;
        content = [
          pubResult.data.description,
          pubResult.data.volume_issue,
          pubResult.data.pub_name
        ].filter(Boolean).join(' • ');
        break;

      case 'photo':
        const photoResult = result as PhotoResult;
        content = [
          photoResult.data.caption,
          photoResult.data.collection,
          photoResult.data.year_or_decade
        ].filter(Boolean).join(' • ');
        break;

      case 'faculty':
        const facultyResult = result as FacultyResult;
        content = [
          facultyResult.data.title,
          facultyResult.data.department,
          facultyResult.data.email
        ].filter(Boolean).join(' • ');
        break;
    }

    // Truncate to max length
    if (content.length > maxLength) {
      content = content.substring(0, maxLength - 3) + '...';
    }

    // Apply highlighting
    if (highlightTerms.length > 0) {
      content = this.highlightText(content, highlightTerms);
    }

    return content;
  }

  private static highlightText(text: string, terms: string[]): string {
    if (!text || terms.length === 0) {
      return text;
    }

    let highlighted = text;
    terms.forEach(term => {
      const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });

    return highlighted;
  }

  private static escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private static resolveThumbnailUrl(path: string, size: FormattingOptions['thumbnailSize'] = 'medium'): string {
    // In a real implementation, this would resolve to actual URLs
    // For now, return the path with size parameter
    const sizeParam = size === 'small' ? '?size=150' : size === 'large' ? '?size=400' : '?size=250';
    return `${path}${sizeParam}`;
  }

  private static extractMetadata(result: SearchResult): Record<string, any> {
    const metadata: Record<string, any> = {
      type: result.type,
      relevanceScore: result.relevanceScore
    };

    switch (result.type) {
      case 'alumni':
        const alumniResult = result as AlumniResult;
        metadata.classYear = alumniResult.data.class_year;
        metadata.role = alumniResult.data.role;
        break;

      case 'publication':
        const pubResult = result as PublicationResult;
        metadata.publicationType = pubResult.data.pub_name;
        metadata.issueDate = pubResult.data.issue_date;
        metadata.volumeIssue = pubResult.data.volume_issue;
        break;

      case 'photo':
        const photoResult = result as PhotoResult;
        metadata.collection = photoResult.data.collection;
        metadata.yearOrDecade = photoResult.data.year_or_decade;
        break;

      case 'faculty':
        const facultyResult = result as FacultyResult;
        metadata.department = facultyResult.data.department;
        metadata.title = facultyResult.data.title;
        break;
    }

    return metadata;
  }

  private static generateDetailUrl(result: SearchResult): string {
    // Generate URL based on result type and ID
    return `/${result.type}/${result.id}`;
  }

  private static generateBadges(result: SearchResult): string[] {
    const badges: string[] = [result.type];

    switch (result.type) {
      case 'alumni':
        const alumniResult = result as AlumniResult;
        if (alumniResult.data.role) {
          badges.push(alumniResult.data.role);
        }
        badges.push(`Class of ${alumniResult.data.class_year}`);
        break;

      case 'publication':
        const pubResult = result as PublicationResult;
        badges.push(pubResult.data.pub_name);
        break;

      case 'photo':
        const photoResult = result as PhotoResult;
        badges.push(photoResult.data.collection);
        if (photoResult.data.year_or_decade) {
          badges.push(photoResult.data.year_or_decade);
        }
        break;

      case 'faculty':
        const facultyResult = result as FacultyResult;
        badges.push(facultyResult.data.department);
        break;
    }

    return badges;
  }

  private static generateCardMetadata(result: SearchResult): Array<{ label: string; value: string }> {
    const metadata: Array<{ label: string; value: string }> = [];

    switch (result.type) {
      case 'alumni':
        const alumniResult = result as AlumniResult;
        metadata.push({ label: 'Class Year', value: alumniResult.data.class_year.toString() });
        if (alumniResult.data.role) {
          metadata.push({ label: 'Role', value: alumniResult.data.role });
        }
        break;

      case 'publication':
        const pubResult = result as PublicationResult;
        metadata.push({ label: 'Publication', value: pubResult.data.pub_name });
        if (pubResult.data.issue_date) {
          metadata.push({ label: 'Date', value: new Date(pubResult.data.issue_date).toLocaleDateString() });
        }
        break;

      case 'photo':
        const photoResult = result as PhotoResult;
        metadata.push({ label: 'Collection', value: photoResult.data.collection });
        if (photoResult.data.year_or_decade) {
          metadata.push({ label: 'Year', value: photoResult.data.year_or_decade });
        }
        break;

      case 'faculty':
        const facultyResult = result as FacultyResult;
        metadata.push({ label: 'Department', value: facultyResult.data.department });
        if (facultyResult.data.email) {
          metadata.push({ label: 'Email', value: facultyResult.data.email });
        }
        break;
    }

    return metadata;
  }

  private static generateListMetadata(result: SearchResult): string[] {
    const metadata: string[] = [];

    switch (result.type) {
      case 'alumni':
        const alumniResult = result as AlumniResult;
        metadata.push(`Class of ${alumniResult.data.class_year}`);
        if (alumniResult.data.role) {
          metadata.push(alumniResult.data.role);
        }
        break;

      case 'publication':
        const pubResult = result as PublicationResult;
        metadata.push(pubResult.data.pub_name);
        if (pubResult.data.volume_issue) {
          metadata.push(pubResult.data.volume_issue);
        }
        break;

      case 'photo':
        const photoResult = result as PhotoResult;
        metadata.push(photoResult.data.collection);
        if (photoResult.data.year_or_decade) {
          metadata.push(photoResult.data.year_or_decade);
        }
        break;

      case 'faculty':
        const facultyResult = result as FacultyResult;
        metadata.push(facultyResult.data.department);
        break;
    }

    return metadata;
  }

  private static getTypeIcon(type: string): string {
    const icons = {
      alumni: '👨‍🎓',
      publication: '📄',
      photo: '📷',
      faculty: '👨‍🏫'
    };
    return icons[type as keyof typeof icons] || '📄';
  }

  private static extractTags(result: SearchResult): string[] {
    let tagsString = '';

    switch (result.type) {
      case 'alumni':
        tagsString = (result as AlumniResult).data.tags || '';
        break;
      case 'publication':
        tagsString = (result as PublicationResult).data.tags || '';
        break;
      case 'photo':
        tagsString = (result as PhotoResult).data.tags || '';
        break;
    }

    return tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  private static extractYear(result: SearchResult): number | null {
    switch (result.type) {
      case 'alumni':
        return (result as AlumniResult).data.class_year;
      case 'publication':
        const pubDate = (result as PublicationResult).data.issue_date;
        return pubDate ? new Date(pubDate).getFullYear() : null;
      case 'photo':
        const yearStr = (result as PhotoResult).data.year_or_decade;
        const year = parseInt(yearStr || '');
        return isNaN(year) ? null : year;
      default:
        return null;
    }
  }

  private static formatAsJSON(results: SearchResult[]): string {
    return JSON.stringify(results, null, 2);
  }

  private static formatAsCSV(results: SearchResult[]): string {
    if (results.length === 0) return '';

    const headers = ['ID', 'Type', 'Title', 'Subtitle', 'Relevance Score'];
    const rows = results.map(result => [
      result.id,
      result.type,
      `"${result.title.replace(/"/g, '""')}"`,
      `"${(result.subtitle || '').replace(/"/g, '""')}"`,
      result.relevanceScore.toString()
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private static formatAsXML(results: SearchResult[]): string {
    const xmlResults = results.map(result => `
      <result>
        <id>${result.id}</id>
        <type>${result.type}</type>
        <title><![CDATA[${result.title}]]></title>
        <subtitle><![CDATA[${result.subtitle || ''}]]></subtitle>
        <relevanceScore>${result.relevanceScore}</relevanceScore>
        <thumbnailPath>${result.thumbnailPath || ''}</thumbnailPath>
      </result>
    `).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
    <searchResults>
      ${xmlResults}
    </searchResults>`;
  }
}

export default ResultFormatter;