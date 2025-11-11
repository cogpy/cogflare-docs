/**
 * Build Operations - Cognitive Implementation
 * 
 * Implements the formal specification build operations from operations.zpp
 * as cognitive processes integrated with OpenCog AtomSpace.
 */

import { AtomSpace } from "../atomspace/atomspace";
import { AtomType } from "../atomspace/atom";
import type { TruthValue } from "../atomspace/atom";
import { ECANManager } from "../ecan/attention";
import { PLNReasoner } from "../pln/reasoner";

/**
 * Build Phase enumeration (from formal spec)
 */
export enum BuildPhase {
  NOT_STARTED = "notStarted",
  INITIALIZATION = "initialization",
  CONTENT_LOADING = "contentLoading",
  SCHEMA_VALIDATION = "schemaValidation",
  MARKDOWN_PROCESSING = "markdownProcessing",
  BUNDLING = "bundling",
  ASSET_OPTIMIZATION = "assetOptimization",
  FINALIZATION = "finalization",
}

/**
 * Build Status enumeration
 */
export enum BuildStatus {
  NOT_STARTED = "notStarted",
  IN_PROGRESS = "inProgress",
  COMPLETED = "completed",
  FAILED = "failed",
}

/**
 * Build State - Cognitive representation
 */
export interface CognitiveBuildState {
  /** Current build status */
  status: BuildStatus;
  
  /** Current build phase */
  currentPhase: BuildPhase;
  
  /** Start timestamp */
  startTime: number | null;
  
  /** End timestamp */
  endTime: number | null;
  
  /** Build errors */
  errors: string[];
  
  /** AtomSpace handle for build state node */
  atomHandle: string;
}

/**
 * Content Page representation
 */
export interface DocsPage {
  title: string;
  slug: string;
  content: string;
  filePath: string;
  products?: string[];
  pcxContentType?: string;
  sidebar?: {
    order: number;
    hidden?: boolean;
  };
  description?: string;
}

/**
 * Build Operations - Cognitive Implementation
 * Implements operations from formal-specs/operations.zpp Part 1
 */
export class CognitiveBuildOperations {
  private atomSpace: AtomSpace;
  private ecan: ECANManager;
  private pln: PLNReasoner;
  private buildState: CognitiveBuildState;
  
  constructor() {
    this.atomSpace = new AtomSpace({
      maxAtoms: 100000,
      enableAttentionDecay: true,
      enableAttentionSpreading: true,
    });
    
    this.ecan = new ECANManager(this.atomSpace);
    this.pln = new PLNReasoner();
    
    // Initialize build state
    const stateNode = this.atomSpace.addNode(
      AtomType.CONCEPT_NODE,
      "BuildState",
    );
    
    this.buildState = {
      status: BuildStatus.NOT_STARTED,
      currentPhase: BuildPhase.NOT_STARTED,
      startTime: null,
      endTime: null,
      errors: [],
      atomHandle: stateNode.handle,
    };
  }
  
  /**
   * StartBuild - Formal spec operation
   * Pre: buildState.status = notStarted
   * Post: buildState.status = inProgress, currentPhase = initialization
   */
  startBuild(): void {
    // Pre-condition check
    if (this.buildState.status !== BuildStatus.NOT_STARTED) {
      throw new Error("Build already started");
    }
    
    // Update state
    this.buildState.status = BuildStatus.IN_PROGRESS;
    this.buildState.currentPhase = BuildPhase.INITIALIZATION;
    this.buildState.startTime = Date.now();
    this.buildState.endTime = null;
    this.buildState.errors = [];
    
    // Create cognitive representation
    const buildNode = this.atomSpace.getAtom(this.buildState.atomHandle)!;
    
    // Stimulate attention - build process is important
    this.ecan.stimulate(buildNode, 100);
    
    // Add status link
    const statusNode = this.atomSpace.addNode(
      AtomType.CONCEPT_NODE,
      "InProgress",
    );
    
    this.atomSpace.addLink(
      AtomType.EVALUATION_LINK,
      [buildNode, statusNode],
    );
    
    console.log("[CognitiveOps] Build started at phase:", this.buildState.currentPhase);
  }
  
  /**
   * LoadContent - Formal spec operation
   * Loads MDX content and creates cognitive representations
   */
  loadContent(contentPaths: string[]): DocsPage[] {
    // Pre-condition check
    if (this.buildState.status !== BuildStatus.IN_PROGRESS) {
      throw new Error("Build not in progress");
    }
    
    this.buildState.currentPhase = BuildPhase.CONTENT_LOADING;
    
    const loadedPages: DocsPage[] = [];
    
    for (const filePath of contentPaths) {
      try {
        // In real implementation, would load actual files
        // For now, create mock page
        const page: DocsPage = {
          title: `Page from ${filePath}`,
          slug: filePath.replace(/\//g, "-").replace(/\.mdx?$/, ""),
          content: "Mock content",
          filePath,
        };
        
        // Create cognitive representation
        const pageNode = this.atomSpace.addNode(
          AtomType.DOC_PAGE_NODE,
          page.slug,
        );
        
        // Link to build state
        const buildNode = this.atomSpace.getAtom(this.buildState.atomHandle)!;
        this.atomSpace.addLink(
          AtomType.MEMBER_LINK,
          [pageNode, buildNode],
        );
        
        // Stimulate attention for loaded page
        this.ecan.stimulate(pageNode, 20);
        
        loadedPages.push(page);
      } catch (error) {
        const errMsg = `Failed to load: ${filePath}`;
        this.buildState.errors.push(errMsg);
      }
    }
    
    console.log(`[CognitiveOps] Loaded ${loadedPages.length} pages`);
    return loadedPages;
  }
  
  /**
   * ValidateSchema - Formal spec operation
   * Validates content against schemas using PLN reasoning
   */
  validateSchema(page: DocsPage): {
    valid: boolean;
    validationErrors: string[];
  } {
    // Pre-condition check
    if (this.buildState.status !== BuildStatus.IN_PROGRESS) {
      throw new Error("Build not in progress");
    }
    
    this.buildState.currentPhase = BuildPhase.SCHEMA_VALIDATION;
    
    const validationErrors: string[] = [];
    
    // Validation checks (from formal spec)
    if (!page.title || page.title.length === 0) {
      validationErrors.push("Missing title");
    }
    
    if (!page.content || page.content.length === 0) {
      validationErrors.push("Missing content");
    }
    
    if (!page.slug || page.slug.length === 0) {
      validationErrors.push("Missing slug");
    }
    
    if (page.sidebar && page.sidebar.order < 0) {
      validationErrors.push("Invalid sidebar order");
    }
    
    const valid = validationErrors.length === 0;
    
    // Create validation result in AtomSpace
    const pageNode = this.atomSpace.getNode(AtomType.DOC_PAGE_NODE, page.slug);
    
    if (pageNode) {
      const validNode = this.atomSpace.addNode(
        AtomType.PREDICATE_NODE,
        valid ? "Valid" : "Invalid",
      );
      
      const truthValue: TruthValue = {
        strength: valid ? 0.95 : 0.05,
        confidence: 0.9,
      };
      
      this.atomSpace.addLink(
        AtomType.EVALUATION_LINK,
        [validNode, pageNode],
        truthValue,
      );
    }
    
    if (!valid) {
      this.buildState.errors.push(...validationErrors.map(e => `${page.filePath}: ${e}`));
    }
    
    return { valid, validationErrors };
  }
  
  /**
   * ProcessMarkdown - Formal spec operation
   * Transforms markdown using plugin pipeline
   */
  processMarkdown(markdownContent: string, filePath: string): string {
    // Pre-condition check
    if (this.buildState.status !== BuildStatus.IN_PROGRESS) {
      throw new Error("Build not in progress");
    }
    
    this.buildState.currentPhase = BuildPhase.MARKDOWN_PROCESSING;
    
    // Create processing node in cognitive space
    const processingNode = this.atomSpace.addNode(
      AtomType.SCHEMA_NODE,
      `Process:${filePath}`,
    );
    
    // Stimulate attention during processing
    this.ecan.stimulate(processingNode, 30);
    
    // In real implementation, would apply remark/rehype plugins
    // For now, return mock HTML
    const html = `<div>${markdownContent}</div>`;
    
    console.log(`[CognitiveOps] Processed markdown for ${filePath}`);
    return html;
  }
  
  /**
   * GenerateStaticAssets - Formal spec operation
   * Creates final build artifacts
   */
  generateStaticAssets(pages: DocsPage[]): Map<string, { path: string; size: number }> {
    // Pre-condition check
    if (this.buildState.status !== BuildStatus.IN_PROGRESS) {
      throw new Error("Build not in progress");
    }
    
    this.buildState.currentPhase = BuildPhase.ASSET_OPTIMIZATION;
    
    const assets = new Map<string, { path: string; size: number }>();
    
    // Generate HTML assets for each page
    for (const page of pages) {
      const assetPath = `${page.slug}/index.html`;
      const asset = {
        path: assetPath,
        size: page.content.length,
      };
      
      assets.set(assetPath, asset);
      
      // Create asset node in AtomSpace
      const assetNode = this.atomSpace.addNode(
        AtomType.CONCEPT_NODE,
        `Asset:${assetPath}`,
      );
      
      const pageNode = this.atomSpace.getNode(AtomType.DOC_PAGE_NODE, page.slug);
      if (pageNode) {
        this.atomSpace.addLink(
          AtomType.EVALUATION_LINK,
          [assetNode, pageNode],
        );
      }
    }
    
    console.log(`[CognitiveOps] Generated ${assets.size} static assets`);
    return assets;
  }
  
  /**
   * CompleteBuild - Formal spec operation
   * Finalizes the build process
   */
  completeBuild(success: boolean): void {
    // Pre-condition check
    if (this.buildState.status !== BuildStatus.IN_PROGRESS) {
      throw new Error("Build not in progress");
    }
    
    this.buildState.currentPhase = BuildPhase.FINALIZATION;
    this.buildState.endTime = Date.now();
    
    if (success && this.buildState.errors.length === 0) {
      this.buildState.status = BuildStatus.COMPLETED;
      console.log("[CognitiveOps] Build completed successfully");
    } else {
      this.buildState.status = BuildStatus.FAILED;
      console.log("[CognitiveOps] Build failed with errors:", this.buildState.errors);
    }
    
    // Update cognitive representation
    const buildNode = this.atomSpace.getAtom(this.buildState.atomHandle)!;
    const statusNode = this.atomSpace.addNode(
      AtomType.CONCEPT_NODE,
      this.buildState.status === BuildStatus.COMPLETED ? "Completed" : "Failed",
    );
    
    this.atomSpace.addLink(
      AtomType.EVALUATION_LINK,
      [buildNode, statusNode],
      {
        strength: success ? 0.95 : 0.05,
        confidence: 0.9,
      },
    );
  }
  
  /**
   * Get current build state
   */
  getBuildState(): CognitiveBuildState {
    return { ...this.buildState };
  }
  
  /**
   * Get AtomSpace for inspection
   */
  getAtomSpace(): AtomSpace {
    return this.atomSpace;
  }
  
  /**
   * Execute ECAN cycle
   */
  executeCognitiveCycle(): void {
    this.ecan.executeCycle();
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
}
