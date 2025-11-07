// Security Manager for Input Validation, Rate Limiting, and Threat Detection
export interface SecurityOptions {
  enableRateLimiting?: boolean;
  enableInputValidation?: boolean;
  enableThreatDetection?: boolean;
  enableAuditLogging?: boolean;
  maxRequestsPerMinute?: number;
  maxQueryLength?: number;
  blockedPatterns?: string[];
  trustedDomains?: string[];
}

export interface SecurityViolation {
  id: string;
  timestamp: Date;
  type: 'RATE_LIMIT' | 'INVALID_INPUT' | 'MALICIOUS_PATTERN' | 'FILE_THREAT' | 'INJECTION_ATTEMPT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  details: any;
  blocked: boolean;
}

export interface RateLimitInfo {
  requests: number;
  windowStart: Date;
  blocked: boolean;
  resetTime: Date;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: string;
  threats: string[];
}

export class SecurityManager {
  private options: SecurityOptions;
  private rateLimitMap: Map<string, RateLimitInfo> = new Map();
  private violations: SecurityViolation[] = [];
  private blockedIPs: Set<string> = new Set();
  private suspiciousPatterns: RegExp[];

  constructor(options: SecurityOptions = {}) {
    this.options = {
      enableRateLimiting: true,
      enableInputValidation: true,
      enableThreatDetection: true,
      enableAuditLogging: true,
      maxRequestsPerMinute: 60,
      maxQueryLength: 1000,
      blockedPatterns: [
        'script',
        'javascript:',
        'vbscript:',
        'onload=',
        'onerror=',
        'eval(',
        'document.cookie',
        'localStorage',
        'sessionStorage'
      ],
      trustedDomains: ['localhost', '127.0.0.1'],
      ...options
    };

    this.suspiciousPatterns = [
      /(<script[^>]*>.*?<\/script>)/gi,
      /(javascript:|vbscript:|data:)/gi,
      /(on\w+\s*=)/gi,
      /(\beval\s*\()/gi,
      /(\bdocument\.\w+)/gi,
      /(\bwindow\.\w+)/gi,
      /(union\s+select)/gi,
      /(drop\s+table)/gi,
      /(insert\s+into)/gi,
      /(delete\s+from)/gi,
      /(\'\s*or\s*\'\s*=\s*\')/gi,
      /(\"\s*or\s*\"\s*=\s*\")/gi,
      /(\/\*.*?\*\/)/gi,
      /(--[^\r\n]*)/gi
    ];

    this.initialize();
  }

  /**
   * Initialize security manager
   */
  private initialize(): void {
    this.setupCleanupTimer();
    this.loadBlockedIPs();
  }

  /**
   * Validate and sanitize search query
   */
  validateSearchQuery(query: string, source: string = 'unknown'): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      threats: []
    };

    if (!this.options.enableInputValidation) {
      result.sanitized = query;
      return result;
    }

    // Check query length
    if (query.length > this.options.maxQueryLength!) {
      result.isValid = false;
      result.errors.push(`Query exceeds maximum length of ${this.options.maxQueryLength} characters`);
      this.logViolation('INVALID_INPUT', 'MEDIUM', source, { 
        reason: 'Query too long', 
        length: query.length 
      });
    }

    // Check for blocked patterns
    const blockedPattern = this.options.blockedPatterns!.find(pattern => 
      query.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (blockedPattern) {
      result.isValid = false;
      result.errors.push(`Query contains blocked pattern: ${blockedPattern}`);
      result.threats.push('BLOCKED_PATTERN');
      this.logViolation('MALICIOUS_PATTERN', 'HIGH', source, { 
        pattern: blockedPattern,
        query: this.sanitizeForLogging(query)
      });
    }

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(query)) {
        result.threats.push('SUSPICIOUS_PATTERN');
        this.logViolation('INJECTION_ATTEMPT', 'HIGH', source, { 
          pattern: pattern.source,
          query: this.sanitizeForLogging(query)
        });
        
        if (result.threats.length > 2) {
          result.isValid = false;
          result.errors.push('Query contains multiple suspicious patterns');
          break;
        }
      }
    }

    // Sanitize query
    result.sanitized = this.sanitizeQuery(query);

    return result;
  }

  /**
   * Sanitize query for safe processing
   */
  private sanitizeQuery(query: string): string {
    let sanitized = query;

    // Remove HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    
    // Remove JavaScript protocols
    sanitized = sanitized.replace(/(javascript:|vbscript:|data:)/gi, '');
    
    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    
    // Remove SQL injection patterns
    sanitized = sanitized.replace(/(\'\s*or\s*\'\s*=\s*\'|\"\s*or\s*\"\s*=\s*\")/gi, '');
    sanitized = sanitized.replace(/(union\s+select|drop\s+table|insert\s+into|delete\s+from)/gi, '');
    
    // Remove comments
    sanitized = sanitized.replace(/(\/\*.*?\*\/|--[^\r\n]*)/gi, '');
    
    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    return sanitized;
  }

  /**
   * Check rate limiting for source
   */
  checkRateLimit(source: string): { allowed: boolean; info: RateLimitInfo } {
    if (!this.options.enableRateLimiting) {
      return {
        allowed: true,
        info: {
          requests: 0,
          windowStart: new Date(),
          blocked: false,
          resetTime: new Date(Date.now() + 60000)
        }
      };
    }

    const now = new Date();
    const windowDuration = 60000; // 1 minute
    
    let rateLimitInfo = this.rateLimitMap.get(source);
    
    if (!rateLimitInfo || now.getTime() - rateLimitInfo.windowStart.getTime() >= windowDuration) {
      // Reset window
      rateLimitInfo = {
        requests: 0,
        windowStart: now,
        blocked: false,
        resetTime: new Date(now.getTime() + windowDuration)
      };
    }

    rateLimitInfo.requests++;
    
    if (rateLimitInfo.requests > this.options.maxRequestsPerMinute!) {
      rateLimitInfo.blocked = true;
      
      this.logViolation('RATE_LIMIT', 'MEDIUM', source, {
        requests: rateLimitInfo.requests,
        limit: this.options.maxRequestsPerMinute,
        windowStart: rateLimitInfo.windowStart
      });
      
      // Temporarily block IP if excessive violations
      if (rateLimitInfo.requests > this.options.maxRequestsPerMinute! * 2) {
        this.blockedIPs.add(source);
        this.logViolation('RATE_LIMIT', 'HIGH', source, {
          reason: 'IP temporarily blocked',
          requests: rateLimitInfo.requests
        });
      }
    }

    this.rateLimitMap.set(source, rateLimitInfo);
    
    return {
      allowed: !rateLimitInfo.blocked && !this.blockedIPs.has(source),
      info: rateLimitInfo
    };
  }

  /**
   * Validate uploaded file
   */
  validateUploadedFile(file: File, allowedTypes: string[] = ['text/csv']): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      threats: []
    };

    if (!this.options.enableThreatDetection) {
      return result;
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      result.isValid = false;
      result.errors.push(`File type ${file.type} is not allowed`);
      result.threats.push('INVALID_FILE_TYPE');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      result.isValid = false;
      result.errors.push(`File size ${file.size} exceeds maximum of ${maxSize} bytes`);
      result.threats.push('FILE_TOO_LARGE');
    }

    // Check file name for suspicious patterns
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js', '.vbs'];
    const hassuspicious = suspiciousExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    if (hassuspicious) {
      result.isValid = false;
      result.errors.push('File has suspicious extension');
      result.threats.push('SUSPICIOUS_FILE_EXTENSION');
    }

    // Log validation attempt
    this.logViolation('FILE_THREAT', result.isValid ? 'LOW' : 'HIGH', 'file_upload', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      threats: result.threats
    });

    return result;
  }

  /**
   * Scan file content for threats
   */
  async scanFileContent(content: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      threats: []
    };

    if (!this.options.enableThreatDetection) {
      return result;
    }

    // Check for malicious patterns in content
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(content)) {
        result.threats.push('MALICIOUS_CONTENT');
        result.errors.push(`Content contains suspicious pattern: ${pattern.source}`);
      }
    }

    // Check for embedded scripts
    if (content.includes('<script') || content.includes('javascript:')) {
      result.isValid = false;
      result.threats.push('EMBEDDED_SCRIPT');
      result.errors.push('Content contains embedded scripts');
    }

    // Check for SQL injection patterns
    const sqlPatterns = [
      /union\s+select/gi,
      /drop\s+table/gi,
      /insert\s+into/gi,
      /delete\s+from/gi
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(content)) {
        result.isValid = false;
        result.threats.push('SQL_INJECTION');
        result.errors.push('Content contains SQL injection patterns');
        break;
      }
    }

    if (result.threats.length > 0) {
      this.logViolation('FILE_THREAT', 'HIGH', 'file_content', {
        threats: result.threats,
        contentLength: content.length
      });
    }

    return result;
  }

  /**
   * Log security violation
   */
  private logViolation(
    type: SecurityViolation['type'],
    severity: SecurityViolation['severity'],
    source: string,
    details: any
  ): void {
    if (!this.options.enableAuditLogging) return;

    const violation: SecurityViolation = {
      id: this.generateViolationId(),
      timestamp: new Date(),
      type,
      severity,
      source,
      details,
      blocked: severity === 'HIGH' || severity === 'CRITICAL'
    };

    this.violations.push(violation);

    // Keep only last 1000 violations
    if (this.violations.length > 1000) {
      this.violations.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security violation:', violation);
    }

    // In production, this would send to a security monitoring system
    this.sendToSecurityMonitoring(violation);
  }

  /**
   * Generate unique violation ID
   */
  private generateViolationId(): string {
    return `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send violation to security monitoring system
   */
  private sendToSecurityMonitoring(violation: SecurityViolation): void {
    // In a real implementation, this would send to a SIEM or security monitoring service
    console.debug('Security monitoring:', violation);
  }

  /**
   * Sanitize data for logging (remove sensitive information)
   */
  private sanitizeForLogging(data: string): string {
    return data.length > 100 ? data.substring(0, 100) + '...' : data;
  }

  /**
   * Get security violations
   */
  getViolations(
    startDate?: Date,
    endDate?: Date,
    type?: SecurityViolation['type']
  ): SecurityViolation[] {
    let filtered = this.violations;

    if (startDate) {
      filtered = filtered.filter(v => v.timestamp >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(v => v.timestamp <= endDate);
    }

    if (type) {
      filtered = filtered.filter(v => v.type === type);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    totalViolations: number;
    violationsByType: Record<string, number>;
    violationsBySeverity: Record<string, number>;
    blockedIPs: number;
    rateLimitedSources: number;
    recentViolations: SecurityViolation[];
  } {
    const violationsByType: Record<string, number> = {};
    const violationsBySeverity: Record<string, number> = {};

    this.violations.forEach(v => {
      violationsByType[v.type] = (violationsByType[v.type] || 0) + 1;
      violationsBySeverity[v.severity] = (violationsBySeverity[v.severity] || 0) + 1;
    });

    const rateLimitedSources = Array.from(this.rateLimitMap.values())
      .filter(info => info.blocked).length;

    const recentViolations = this.violations
      .filter(v => Date.now() - v.timestamp.getTime() < 24 * 60 * 60 * 1000) // Last 24 hours
      .slice(0, 10);

    return {
      totalViolations: this.violations.length,
      violationsByType,
      violationsBySeverity,
      blockedIPs: this.blockedIPs.size,
      rateLimitedSources,
      recentViolations
    };
  }

  /**
   * Block IP address
   */
  blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip);
    this.logViolation('RATE_LIMIT', 'HIGH', ip, { reason: `Manually blocked: ${reason}` });
  }

  /**
   * Unblock IP address
   */
  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
  }

  /**
   * Check if IP is blocked
   */
  isBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  /**
   * Setup cleanup timer for old data
   */
  private setupCleanupTimer(): void {
    setInterval(() => {
      this.cleanupOldData();
    }, 60000); // Run every minute
  }

  /**
   * Cleanup old rate limit and violation data
   */
  private cleanupOldData(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Clean up old rate limit data
    for (const [source, info] of this.rateLimitMap.entries()) {
      if (info.windowStart < oneHourAgo) {
        this.rateLimitMap.delete(source);
      }
    }

    // Clean up old violations (keep only last 24 hours)
    this.violations = this.violations.filter(v => v.timestamp > oneDayAgo);

    // Unblock IPs after 1 hour (except manually blocked ones)
    // This would need additional logic to track manual vs automatic blocks
  }

  /**
   * Load blocked IPs from storage
   */
  private loadBlockedIPs(): void {
    try {
      const stored = localStorage.getItem('security-blocked-ips');
      if (stored) {
        const ips = JSON.parse(stored);
        this.blockedIPs = new Set(ips);
      }
    } catch (error) {
      console.warn('Failed to load blocked IPs:', error);
    }
  }

  /**
   * Save blocked IPs to storage
   */
  private saveBlockedIPs(): void {
    try {
      const ips = Array.from(this.blockedIPs);
      localStorage.setItem('security-blocked-ips', JSON.stringify(ips));
    } catch (error) {
      console.warn('Failed to save blocked IPs:', error);
    }
  }

  /**
   * Export security data
   */
  exportSecurityData(): {
    violations: SecurityViolation[];
    blockedIPs: string[];
    rateLimitInfo: Array<{ source: string; info: RateLimitInfo }>;
    stats: ReturnType<typeof this.getSecurityStats>;
  } {
    return {
      violations: this.violations,
      blockedIPs: Array.from(this.blockedIPs),
      rateLimitInfo: Array.from(this.rateLimitMap.entries()).map(([source, info]) => ({
        source,
        info
      })),
      stats: this.getSecurityStats()
    };
  }

  /**
   * Cleanup security manager
   */
  destroy(): void {
    this.saveBlockedIPs();
  }
}

// Global security manager instance
let globalSecurityManager: SecurityManager | null = null;

export function getSecurityManager(options?: SecurityOptions): SecurityManager {
  if (!globalSecurityManager) {
    globalSecurityManager = new SecurityManager(options);
  }
  return globalSecurityManager;
}

export default SecurityManager;