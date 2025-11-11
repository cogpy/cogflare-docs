/**
 * OpenCog Integration Layer
 * 
 * Main entry point for the CogPrime cognitive architecture integration
 * with the Cloudflare documentation platform.
 * 
 * This module provides the bridge between the formal specifications
 * and the OpenCog cognitive architecture implementation.
 */

import { AtomSpace } from "./atomspace/atomspace";
import { AtomType } from "./atomspace/atom";
import type { Atom, TruthValue, AttentionValue } from "./atomspace/atom";
import { ECANManager } from "./ecan/attention";
import { PLNReasoner, PLNQueryEngine } from "./pln/reasoner";
import { CognitiveBuildOperations } from "./operations/build-operations";
import { CognitiveWorkerOperations } from "./operations/worker-operations";

/**
 * CogPrime System Configuration
 */
export interface CogPrimeConfig {
  /** Maximum atoms in AtomSpace */
  maxAtoms?: number;
  
  /** Enable ECAN attention dynamics */
  enableECAN?: boolean;
  
  /** Enable PLN reasoning */
  enablePLN?: boolean;
  
  /** Attention focus size */
  focusSize?: number;
  
  /** Cognitive cycle interval (ms) */
  cycleInterval?: number;
}

/**
 * CogPrime Integration - Main cognitive system
 * 
 * Integrates all cognitive components:
 * - AtomSpace (knowledge representation)
 * - ECAN (attention allocation)
 * - PLN (reasoning)
 * - Build operations (cognitive build process)
 * - Worker operations (cognitive request handling)
 */
export class CogPrime {
  private atomSpace: AtomSpace;
  private ecan: ECANManager | null;
  private pln: PLNReasoner;
  private queryEngine: PLNQueryEngine;
  private buildOps: CognitiveBuildOperations;
  private workerOps: CognitiveWorkerOperations;
  private config: Required<CogPrimeConfig>;
  private cycleTimer: NodeJS.Timeout | null = null;
  
  constructor(config: CogPrimeConfig = {}) {
    this.config = {
      maxAtoms: config.maxAtoms ?? 100000,
      enableECAN: config.enableECAN ?? true,
      enablePLN: config.enablePLN ?? true,
      focusSize: config.focusSize ?? 100,
      cycleInterval: config.cycleInterval ?? 1000, // 1 second
    };
    
    // Initialize core components
    this.atomSpace = new AtomSpace({
      maxAtoms: this.config.maxAtoms,
      enableAttentionDecay: this.config.enableECAN,
      enableAttentionSpreading: this.config.enableECAN,
    });
    
    this.ecan = this.config.enableECAN 
      ? new ECANManager(this.atomSpace, { focusSize: this.config.focusSize })
      : null;
    
    this.pln = new PLNReasoner();
    this.queryEngine = new PLNQueryEngine();
    
    // Initialize operation modules
    this.buildOps = new CognitiveBuildOperations();
    this.workerOps = new CognitiveWorkerOperations();
    
    console.log("[CogPrime] Initialized with configuration:", this.config);
  }
  
  /**
   * Start autonomous cognitive cycles
   */
  startCognitiveCycles(): void {
    if (this.cycleTimer) {
      console.warn("[CogPrime] Cognitive cycles already running");
      return;
    }
    
    console.log("[CogPrime] Starting cognitive cycles");
    
    this.cycleTimer = setInterval(() => {
      this.executeCognitiveCycle();
    }, this.config.cycleInterval);
  }
  
  /**
   * Stop autonomous cognitive cycles
   */
  stopCognitiveCycles(): void {
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
      console.log("[CogPrime] Stopped cognitive cycles");
    }
  }
  
  /**
   * Execute one cognitive cycle
   * Implements the cognitive cycle from CogPrime architecture:
   * 1. Perception (not implemented here)
   * 2. Pattern Recognition
   * 3. Memory Integration
   * 4. Reasoning
   * 5. Goal Evaluation (not implemented here)
   * 6. Action Selection (not implemented here)
   * 7. Learning (implicit through attention)
   */
  executeCognitiveCycle(): void {
    // Execute AtomSpace cognitive cycle
    this.atomSpace.executeCognitiveCycle();
    
    // Execute ECAN cycle
    if (this.ecan) {
      const stats = this.ecan.executeCycle();
      
      if (stats.forgotten > 0) {
        console.log(`[CogPrime] Cognitive cycle: forgot ${stats.forgotten} atoms`);
      }
    }
  }
  
  /**
   * Get build operations interface
   */
  getBuildOperations(): CognitiveBuildOperations {
    return this.buildOps;
  }
  
  /**
   * Get worker operations interface
   */
  getWorkerOperations(): CognitiveWorkerOperations {
    return this.workerOps;
  }
  
  /**
   * Get AtomSpace for direct access
   */
  getAtomSpace(): AtomSpace {
    return this.atomSpace;
  }
  
  /**
   * Get ECAN manager
   */
  getECAN(): ECANManager | null {
    return this.ecan;
  }
  
  /**
   * Get PLN reasoner
   */
  getPLN(): PLNReasoner {
    return this.pln;
  }
  
  /**
   * Get query engine
   */
  getQueryEngine(): PLNQueryEngine {
    return this.queryEngine;
  }
  
  /**
   * Get comprehensive system statistics
   */
  getSystemStatistics(): {
    atomSpace: ReturnType<typeof this.atomSpace.getStatistics>;
    ecan?: ReturnType<typeof this.ecan.getStatistics>;
    buildOps: ReturnType<typeof this.buildOps.getCognitiveStatistics>;
    workerOps: {
      worker: ReturnType<typeof this.workerOps.getWorkerStatistics>;
      cognitive: ReturnType<typeof this.workerOps.getCognitiveStatistics>;
    };
  } {
    return {
      atomSpace: this.atomSpace.getStatistics(),
      ecan: this.ecan?.getStatistics(),
      buildOps: this.buildOps.getCognitiveStatistics(),
      workerOps: {
        worker: this.workerOps.getWorkerStatistics(),
        cognitive: this.workerOps.getCognitiveStatistics(),
      },
    };
  }
  
  /**
   * Add knowledge directly to the system
   */
  addKnowledge(
    type: AtomType,
    name: string,
    tv?: TruthValue,
    av?: AttentionValue,
  ): Atom {
    return this.atomSpace.addNode(type, name, tv, av);
  }
  
  /**
   * Query knowledge from the system
   */
  queryKnowledge(pattern: Partial<Atom>): Atom[] {
    return this.atomSpace.query(pattern);
  }
  
  /**
   * Get current attentional focus
   */
  getAttentionalFocus(limit?: number): Atom[] {
    return this.atomSpace.getAttentionalFocus(limit);
  }
  
  /**
   * Shutdown the cognitive system
   */
  shutdown(): void {
    console.log("[CogPrime] Shutting down cognitive system");
    
    this.stopCognitiveCycles();
    this.atomSpace.clear();
    
    console.log("[CogPrime] Shutdown complete");
  }
}

/**
 * Create a global CogPrime instance (singleton)
 */
let globalCogPrime: CogPrime | null = null;

/**
 * Get or create the global CogPrime instance
 */
export function getCogPrime(config?: CogPrimeConfig): CogPrime {
  if (!globalCogPrime) {
    globalCogPrime = new CogPrime(config);
  }
  return globalCogPrime;
}

/**
 * Reset the global CogPrime instance (for testing)
 */
export function resetCogPrime(): void {
  if (globalCogPrime) {
    globalCogPrime.shutdown();
    globalCogPrime = null;
  }
}

// Export all components
export { AtomSpace, AtomType };
export type { Atom, TruthValue, AttentionValue };
export { ECANManager };
export { PLNReasoner, PLNQueryEngine };
export { CognitiveBuildOperations };
export { CognitiveWorkerOperations };
