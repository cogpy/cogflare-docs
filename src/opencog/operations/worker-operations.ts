/**
 * Worker Operations - Cognitive Implementation
 * 
 * Implements the formal specification worker operations from operations.zpp
 * Part 2 as cognitive processes integrated with OpenCog AtomSpace.
 */

import { AtomSpace } from "../atomspace/atomspace";
import { AtomType } from "../atomspace/atom";
import type { TruthValue } from "../atomspace/atom";
import { ECANManager } from "../ecan/attention";
import { PLNQueryEngine } from "../pln/reasoner";

/**
 * HTTP Request representation
 */
export interface HTTPRequest {
  method: string;
  url: string;
  path: string;
  headers: Record<string, string>;
  body?: string;
}

/**
 * HTTP Response representation
 */
export interface HTTPResponse {
  status: string;
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  cacheStatus?: "hit" | "miss" | "stale";
}

/**
 * Redirect Rule
 */
export interface RedirectRule {
  sourcePattern: string;
  targetUrl: string;
  statusCode: number;
  isRegex: boolean;
}

/**
 * Worker Runtime State - Cognitive representation
 */
export interface CognitiveWorkerState {
  /** Request count */
  requestCount: number;
  
  /** Error count */
  errorCount: number;
  
  /** Redirect rules */
  redirectRules: RedirectRule[];
  
  /** AtomSpace handle for worker state */
  atomHandle: string;
}

/**
 * Worker Operations - Cognitive Implementation
 * Implements operations from formal-specs/operations.zpp Part 2
 */
export class CognitiveWorkerOperations {
  private atomSpace: AtomSpace;
  private ecan: ECANManager;
  private queryEngine: PLNQueryEngine;
  private workerState: CognitiveWorkerState;
  private cache: Map<string, { response: HTTPResponse; expiresAt: number }>;
  
  constructor() {
    this.atomSpace = new AtomSpace({
      maxAtoms: 50000,
      enableAttentionDecay: true,
      enableAttentionSpreading: true,
    });
    
    this.ecan = new ECANManager(this.atomSpace);
    this.queryEngine = new PLNQueryEngine();
    this.cache = new Map();
    
    // Initialize worker state
    const stateNode = this.atomSpace.addNode(
      AtomType.CONCEPT_NODE,
      "WorkerState",
    );
    
    this.workerState = {
      requestCount: 0,
      errorCount: 0,
      redirectRules: [],
      atomHandle: stateNode.handle,
    };
  }
  
  /**
   * InitializeWorker - Formal spec operation
   * Sets up worker runtime environment with redirect rules
   */
  initializeWorker(redirectsContent: string): void {
    // Parse redirect rules
    const rules = this.parseRedirectsFile(redirectsContent);
    this.workerState.redirectRules = rules;
    
    // Create cognitive representation for each rule
    for (const rule of rules) {
      const ruleNode = this.atomSpace.addNode(
        AtomType.CONCEPT_NODE,
        `Redirect:${rule.sourcePattern}`,
      );
      
      const targetNode = this.atomSpace.addNode(
        AtomType.CONCEPT_NODE,
        `Target:${rule.targetUrl}`,
      );
      
      // Create redirect link
      this.atomSpace.addLink(
        AtomType.EVALUATION_LINK,
        [ruleNode, targetNode],
        {
          strength: 0.95,
          confidence: 0.9,
        },
      );
      
      // Stimulate attention for frequently used redirects
      if (rule.sourcePattern.includes("popular")) {
        this.ecan.stimulate(ruleNode, 50);
      }
    }
    
    console.log(`[CognitiveWorker] Initialized with ${rules.length} redirect rules`);
  }
  
  /**
   * HandleRequest - Main entry point (formal spec)
   * Processes incoming HTTP requests with cognitive routing
   */
  handleRequest(request: HTTPRequest): HTTPResponse {
    this.workerState.requestCount++;
    
    // Create request node in cognitive space
    const requestNode = this.atomSpace.addNode(
      AtomType.CONCEPT_NODE,
      `Request:${request.path}`,
    );
    
    // Stimulate attention for this request
    this.ecan.stimulate(requestNode, 30);
    
    // Check cache first
    const cached = this.checkCache(request);
    if (cached) {
      console.log(`[CognitiveWorker] Cache hit for ${request.path}`);
      return cached;
    }
    
    // Route based on path (cognitive decision making)
    let response: HTTPResponse;
    
    if (request.path === "/markdown.zip" || request.path === "/llms-full.txt") {
      response = this.handleVendoredMarkdown(request);
    } else if (
      request.path.endsWith("/index.md") ||
      request.headers["accept"]?.includes("text/markdown")
    ) {
      response = this.handleMarkdownConversion(request);
    } else {
      response = this.handleStandardRequest(request);
    }
    
    // Update error count if needed
    if (response.statusCode >= 500) {
      this.workerState.errorCount++;
    }
    
    // Cache successful responses
    if (response.statusCode === 200) {
      this.updateCache(request, response, 3600); // 1 hour TTL
    }
    
    // Execute cognitive cycle periodically
    if (this.workerState.requestCount % 100 === 0) {
      this.ecan.executeCycle();
    }
    
    return response;
  }
  
  /**
   * HandleVendoredMarkdown - Formal spec operation
   * Serves pre-generated markdown from R2
   */
  handleVendoredMarkdown(request: HTTPRequest): HTTPResponse {
    console.log(`[CognitiveWorker] Serving vendored markdown: ${request.path}`);
    
    // In real implementation, would fetch from R2
    // For now, return mock response
    return {
      status: "ok_200",
      statusCode: 200,
      headers: {
        "Content-Type": request.path.endsWith(".zip") 
          ? "application/zip" 
          : "text/plain",
      },
      body: "Mock vendored content",
    };
  }
  
  /**
   * HandleMarkdownConversion - Formal spec operation
   * Converts HTML to markdown on-demand
   */
  handleMarkdownConversion(request: HTTPRequest): HTTPResponse {
    console.log(`[CognitiveWorker] Converting to markdown: ${request.path}`);
    
    // Create conversion node in cognitive space
    const conversionNode = this.atomSpace.addNode(
      AtomType.SCHEMA_NODE,
      `Convert:${request.path}`,
    );
    
    // Stimulate attention for conversion process
    this.ecan.stimulate(conversionNode, 25);
    
    // In real implementation, would fetch HTML and convert
    // For now, return mock markdown
    return {
      status: "ok_200",
      statusCode: 200,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "x-robots-tag": "noindex",
      },
      body: "# Mock Markdown\n\nConverted content",
    };
  }
  
  /**
   * EvaluateRedirects - Formal spec operation
   * Checks if request should be redirected using cognitive pattern matching
   */
  evaluateRedirects(request: HTTPRequest): HTTPResponse | null {
    // Use cognitive pattern matching to find matching redirect
    for (const rule of this.workerState.redirectRules) {
      let matches = false;
      
      if (rule.isRegex) {
        const regex = new RegExp(rule.sourcePattern);
        matches = regex.test(request.path);
      } else {
        matches = request.path === rule.sourcePattern;
      }
      
      if (matches) {
        // Found matching redirect
        const ruleNode = this.atomSpace.getNode(
          AtomType.CONCEPT_NODE,
          `Redirect:${rule.sourcePattern}`,
        );
        
        // Increase attention for used redirect
        if (ruleNode) {
          this.ecan.stimulate(ruleNode, 10);
        }
        
        return {
          status: rule.statusCode === 301 ? "redirect_301" : "redirect_302",
          statusCode: rule.statusCode,
          headers: {
            Location: rule.targetUrl,
          },
          body: "",
        };
      }
    }
    
    return null;
  }
  
  /**
   * HandleStandardRequest - Formal spec operation
   * Serves static assets or applies redirects
   */
  handleStandardRequest(request: HTTPRequest): HTTPResponse {
    // Try redirects first
    const redirect = this.evaluateRedirects(request);
    if (redirect) {
      return redirect;
    }
    
    // Try with trailing slash
    if (!request.path.endsWith("/")) {
      const trailingSlashRequest = {
        ...request,
        path: request.path + "/",
      };
      const redirect2 = this.evaluateRedirects(trailingSlashRequest);
      if (redirect2) {
        return redirect2;
      }
    }
    
    // Serve asset (mock implementation)
    // In real implementation, would fetch from assets binding
    if (request.path === "/" || request.path.endsWith("/")) {
      return {
        status: "ok_200",
        statusCode: 200,
        headers: {
          "Content-Type": "text/html",
        },
        body: "<html><body>Mock page</body></html>",
      };
    }
    
    // 404 Not Found
    return {
      status: "notFound_404",
      statusCode: 404,
      headers: {
        "Content-Type": "text/html",
      },
      body: "Not Found",
    };
  }
  
  /**
   * CheckCache - Formal spec operation (Part 3)
   * Determines if request can be served from cache
   */
  checkCache(request: HTTPRequest): HTTPResponse | null {
    const cached = this.cache.get(request.url);
    
    if (!cached) {
      return null;
    }
    
    // Check expiration
    if (Date.now() >= cached.expiresAt) {
      this.cache.delete(request.url);
      return null;
    }
    
    return {
      ...cached.response,
      cacheStatus: "hit",
    };
  }
  
  /**
   * UpdateCache - Formal spec operation (Part 3)
   * Stores response in cache with TTL
   */
  updateCache(request: HTTPRequest, response: HTTPResponse, ttl: number): void {
    if (response.statusCode !== 200) {
      return;
    }
    
    const expiresAt = Date.now() + ttl * 1000;
    
    this.cache.set(request.url, {
      response,
      expiresAt,
    });
    
    // Create cache entry node
    const cacheNode = this.atomSpace.addNode(
      AtomType.CONCEPT_NODE,
      `Cache:${request.url}`,
    );
    
    // Link to request
    const requestNode = this.atomSpace.getNode(
      AtomType.CONCEPT_NODE,
      `Request:${request.path}`,
    );
    
    if (requestNode) {
      this.atomSpace.addLink(
        AtomType.EVALUATION_LINK,
        [cacheNode, requestNode],
      );
    }
  }
  
  /**
   * SearchContent - Formal spec operation (Part 4)
   * Full-text search using cognitive pattern matching
   */
  searchContent(query: string): string[] {
    console.log(`[CognitiveWorker] Searching for: ${query}`);
    
    // Create query node
    const queryNode = this.atomSpace.addNode(
      AtomType.PREDICATE_NODE,
      `Search:${query}`,
    );
    
    // Stimulate attention for search
    this.ecan.stimulate(queryNode, 40);
    
    // In real implementation, would search through content
    // For now, return mock results
    return ["result1", "result2", "result3"];
  }
  
  /**
   * Get worker statistics
   */
  getWorkerStatistics(): {
    requestCount: number;
    errorCount: number;
    cacheSize: number;
    redirectRules: number;
  } {
    return {
      requestCount: this.workerState.requestCount,
      errorCount: this.workerState.errorCount,
      cacheSize: this.cache.size,
      redirectRules: this.workerState.redirectRules.length,
    };
  }
  
  /**
   * Get cognitive statistics
   */
  getCognitiveStatistics(): {
    atomSpace: ReturnType<typeof this.atomSpace.getStatistics>;
    ecan: ReturnType<typeof this.ecan.getStatistics>;
  } {
    return {
      atomSpace: this.atomSpace.getStatistics(),
      ecan: this.ecan.getStatistics(),
    };
  }
  
  /**
   * Parse redirects file (helper)
   */
  private parseRedirectsFile(content: string): RedirectRule[] {
    const rules: RedirectRule[] = [];
    const lines = content.split("\n");
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      
      // Simple parsing: /source /target status
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        rules.push({
          sourcePattern: parts[0],
          targetUrl: parts[1],
          statusCode: parts.length > 2 ? parseInt(parts[2]) : 302,
          isRegex: parts[0].includes("*") || parts[0].includes("("),
        });
      }
    }
    
    return rules;
  }
}
