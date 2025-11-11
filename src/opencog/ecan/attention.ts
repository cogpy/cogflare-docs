/**
 * ECAN - Economic Attention Networks
 * 
 * Implements cognitive resource allocation through attention dynamics.
 * Manages STI/LTI/VLTI values and attentional focus for cognitive efficiency.
 */

import type { Atom, AttentionValue } from "../atomspace/atom";
import { AtomSpace } from "../atomspace/atomspace";

/**
 * ECAN Configuration
 */
export interface ECANConfig {
  /** Maximum STI (attention budget) */
  maxSTI: number;
  
  /** Target size of attentional focus */
  focusSize: number;
  
  /** STI decay rate per cycle */
  decayRate: number;
  
  /** Importance spreading rate */
  spreadingRate: number;
  
  /** Minimum STI before atom becomes eligible for forgetting */
  forgetThreshold: number;
  
  /** Rent charged per cycle for being in attentional focus */
  attentionRent: number;
}

/**
 * Attention Allocation Bank
 * Manages the economy of attention resources
 */
export class AttentionBank {
  private config: ECANConfig;
  private totalSTI: number = 0;
  private totalLTI: number = 0;
  
  constructor(config: Partial<ECANConfig> = {}) {
    this.config = {
      maxSTI: config.maxSTI ?? 100000,
      focusSize: config.focusSize ?? 100,
      decayRate: config.decayRate ?? 0.01,
      spreadingRate: config.spreadingRate ?? 0.1,
      forgetThreshold: config.forgetThreshold ?? 1,
      attentionRent: config.attentionRent ?? 1,
    };
  }
  
  /**
   * Initialize attention economy with total budget
   */
  initialize(totalSTI: number, totalLTI: number): void {
    this.totalSTI = totalSTI;
    this.totalLTI = totalLTI;
  }
  
  /**
   * Get current attention statistics
   */
  getStatistics(): {
    totalSTI: number;
    totalLTI: number;
    availableSTI: number;
    stiUtilization: number;
  } {
    const availableSTI = this.config.maxSTI - this.totalSTI;
    const stiUtilization = this.totalSTI / this.config.maxSTI;
    
    return {
      totalSTI: this.totalSTI,
      totalLTI: this.totalLTI,
      availableSTI,
      stiUtilization,
    };
  }
  
  /**
   * Allocate STI to an atom
   */
  allocateSTI(amount: number): boolean {
    if (this.totalSTI + amount > this.config.maxSTI) {
      return false; // Not enough budget
    }
    
    this.totalSTI += amount;
    return true;
  }
  
  /**
   * Deallocate STI from an atom
   */
  deallocateSTI(amount: number): void {
    this.totalSTI = Math.max(0, this.totalSTI - amount);
  }
  
  /**
   * Allocate LTI to an atom
   */
  allocateLTI(amount: number): void {
    this.totalLTI += amount;
  }
  
  /**
   * Deallocate LTI from an atom
   */
  deallocateLTI(amount: number): void {
    this.totalLTI = Math.max(0, this.totalLTI - amount);
  }
  
  /**
   * Check if atom is in attentional focus
   */
  isInFocus(av: AttentionValue): boolean {
    // Simple threshold-based focus
    return av.sti > 50;
  }
  
  /**
   * Calculate rent for being in attentional focus
   */
  calculateRent(av: AttentionValue): number {
    if (this.isInFocus(av)) {
      return this.config.attentionRent;
    }
    return 0;
  }
}

/**
 * Importance Spreading - Diffusion of attention along links
 */
export class ImportanceSpreader {
  private atomSpace: AtomSpace;
  private spreadingRate: number;
  
  constructor(atomSpace: AtomSpace, spreadingRate: number = 0.1) {
    this.atomSpace = atomSpace;
    this.spreadingRate = spreadingRate;
  }
  
  /**
   * Spread importance from source atom to connected atoms
   */
  spread(source: Atom): void {
    const spreadAmount = source.av.sti * this.spreadingRate;
    
    if (spreadAmount < 0.1) return; // Don't spread tiny amounts
    
    // Get incoming and outgoing atoms
    const incoming = this.atomSpace.getIncoming(source);
    const outgoing = "outgoing" in source 
      ? (source as any).outgoing 
      : [];
    
    const connected = [...incoming, ...outgoing];
    if (connected.length === 0) return;
    
    // Distribute attention among connected atoms
    const amountPerAtom = spreadAmount / connected.length;
    
    for (const atom of connected) {
      atom.av.sti += amountPerAtom;
    }
    
    // Reduce source STI
    source.av.sti -= spreadAmount;
  }
  
  /**
   * Spread importance from all high-attention atoms
   */
  spreadFromFocus(focusAtoms: Atom[]): void {
    for (const atom of focusAtoms) {
      this.spread(atom);
    }
  }
}

/**
 * Forgetting Mechanism - Remove low-importance atoms
 */
export class ForgettingAgent {
  private atomSpace: AtomSpace;
  private forgetThreshold: number;
  
  constructor(atomSpace: AtomSpace, forgetThreshold: number = 1) {
    this.atomSpace = atomSpace;
    this.forgetThreshold = forgetThreshold;
  }
  
  /**
   * Identify atoms eligible for forgetting
   */
  identifyForgettable(): Atom[] {
    const allAtoms = this.atomSpace.query({});
    
    return allAtoms.filter((atom) => {
      return (
        atom.av.sti < this.forgetThreshold &&
        atom.av.lti < 10 &&
        atom.av.vlti === 0
      );
    });
  }
  
  /**
   * Forget (remove) low-importance atoms
   */
  forget(maxToForget: number = 10): number {
    const forgettable = this.identifyForgettable();
    
    // Sort by STI (lowest first)
    forgettable.sort((a, b) => a.av.sti - b.av.sti);
    
    const toForget = forgettable.slice(0, maxToForget);
    
    // In a full implementation, would remove atoms from AtomSpace
    // For now, just mark as forgotten by zeroing attention
    for (const atom of toForget) {
      atom.av.sti = 0;
      atom.av.lti = 0;
    }
    
    return toForget.length;
  }
}

/**
 * ECAN Manager - Orchestrates all attention mechanisms
 */
export class ECANManager {
  private atomSpace: AtomSpace;
  private bank: AttentionBank;
  private spreader: ImportanceSpreader;
  private forgetter: ForgettingAgent;
  private config: ECANConfig;
  
  constructor(atomSpace: AtomSpace, config: Partial<ECANConfig> = {}) {
    this.atomSpace = atomSpace;
    
    this.config = {
      maxSTI: config.maxSTI ?? 100000,
      focusSize: config.focusSize ?? 100,
      decayRate: config.decayRate ?? 0.01,
      spreadingRate: config.spreadingRate ?? 0.1,
      forgetThreshold: config.forgetThreshold ?? 1,
      attentionRent: config.attentionRent ?? 1,
    };
    
    this.bank = new AttentionBank(this.config);
    this.spreader = new ImportanceSpreader(atomSpace, this.config.spreadingRate);
    this.forgetter = new ForgettingAgent(atomSpace, this.config.forgetThreshold);
  }
  
  /**
   * Execute one ECAN cycle
   * 1. Collect rent from focus atoms
   * 2. Decay attention values
   * 3. Spread importance
   * 4. Update attentional focus
   * 5. Forget low-importance atoms
   */
  executeCycle(): {
    focusSize: number;
    forgotten: number;
    totalSTI: number;
  } {
    // Get current attentional focus
    const focus = this.atomSpace.getAttentionalFocus(this.config.focusSize);
    
    // Collect rent
    for (const atom of focus) {
      const rent = this.bank.calculateRent(atom.av);
      atom.av.sti = Math.max(0, atom.av.sti - rent);
    }
    
    // Execute cognitive cycle (includes decay)
    this.atomSpace.executeCognitiveCycle();
    
    // Spread importance from focus
    this.spreader.spreadFromFocus(focus);
    
    // Forget low-importance atoms
    const forgotten = this.forgetter.forget(10);
    
    // Get statistics
    const stats = this.atomSpace.getStatistics();
    
    return {
      focusSize: focus.length,
      forgotten,
      totalSTI: stats.averageSTI * stats.totalAtoms,
    };
  }
  
  /**
   * Stimulate an atom (increase its STI)
   */
  stimulate(atom: Atom, amount: number): boolean {
    if (this.bank.allocateSTI(amount)) {
      atom.av.sti += amount;
      return true;
    }
    return false;
  }
  
  /**
   * Get current attentional focus
   */
  getAttentionalFocus(): Atom[] {
    return this.atomSpace.getAttentionalFocus(this.config.focusSize);
  }
  
  /**
   * Get ECAN statistics
   */
  getStatistics(): {
    bankStats: ReturnType<typeof this.bank.getStatistics>;
    atomSpaceStats: ReturnType<typeof this.atomSpace.getStatistics>;
    forgettableCount: number;
  } {
    return {
      bankStats: this.bank.getStatistics(),
      atomSpaceStats: this.atomSpace.getStatistics(),
      forgettableCount: this.forgetter.identifyForgettable().length,
    };
  }
}
