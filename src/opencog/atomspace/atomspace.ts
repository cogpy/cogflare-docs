/**
 * AtomSpace - Core hypergraph knowledge base
 * 
 * Implements the central knowledge representation structure for OpenCog,
 * providing glocal memory with both localized and global access patterns.
 */

import type {
  Atom,
  Node,
  Link,
  AtomType,
  TruthValue,
  AttentionValue,
} from "./atom";
import {
  generateHandle,
  createDefaultTruthValue,
  createDefaultAttentionValue,
  revisionTruthValue,
  decayAttentionValue,
} from "./atom";

/**
 * AtomSpace configuration
 */
export interface AtomSpaceConfig {
  /** Maximum number of atoms to store */
  maxAtoms?: number;
  
  /** Enable automatic attention decay */
  enableAttentionDecay?: boolean;
  
  /** Attention decay rate (per cycle) */
  attentionDecayRate?: number;
  
  /** Attention spreading enabled */
  enableAttentionSpreading?: boolean;
}

/**
 * AtomSpace - Hypergraph knowledge base
 */
export class AtomSpace {
  /** All atoms indexed by handle */
  private atoms: Map<string, Atom> = new Map();
  
  /** Index by atom type for efficient queries */
  private typeIndex: Map<AtomType, Set<string>> = new Map();
  
  /** Index by name for node lookup */
  private nameIndex: Map<string, Set<string>> = new Map();
  
  /** Incoming set index - tracks atoms pointing to each atom */
  private incomingIndex: Map<string, Set<string>> = new Map();
  
  /** Configuration */
  private config: Required<AtomSpaceConfig>;
  
  /** Cognitive cycle counter */
  private cycleCount: number = 0;
  
  constructor(config: AtomSpaceConfig = {}) {
    this.config = {
      maxAtoms: config.maxAtoms ?? 100000,
      enableAttentionDecay: config.enableAttentionDecay ?? true,
      attentionDecayRate: config.attentionDecayRate ?? 0.01,
      enableAttentionSpreading: config.enableAttentionSpreading ?? true,
    };
  }
  
  /**
   * Add a node to the AtomSpace
   */
  addNode(type: AtomType, name: string, tv?: TruthValue, av?: AttentionValue): Node {
    // Check if node already exists
    const existing = this.getNode(type, name);
    if (existing) {
      // Merge truth values if provided
      if (tv) {
        existing.tv = revisionTruthValue(existing.tv, tv);
      }
      // Update attention if provided
      if (av) {
        existing.av = av;
      }
      existing.lastAccessed = Date.now();
      return existing;
    }
    
    // Create new node
    const handle = generateHandle();
    const node: Node = {
      handle,
      type,
      name,
      tv: tv ?? createDefaultTruthValue(),
      av: av ?? createDefaultAttentionValue(),
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    };
    
    // Store in indexes
    this.atoms.set(handle, node);
    this.addToTypeIndex(type, handle);
    this.addToNameIndex(name, handle);
    
    return node;
  }
  
  /**
   * Add a link to the AtomSpace
   */
  addLink(type: AtomType, outgoing: Atom[], tv?: TruthValue, av?: AttentionValue): Link {
    // Check for existing link with same structure
    const existing = this.getLink(type, outgoing);
    if (existing) {
      // Merge truth values if provided
      if (tv) {
        existing.tv = revisionTruthValue(existing.tv, tv);
      }
      // Update attention if provided
      if (av) {
        existing.av = av;
      }
      existing.lastAccessed = Date.now();
      return existing;
    }
    
    // Create new link
    const handle = generateHandle();
    const link: Link = {
      handle,
      type,
      name: "",
      outgoing,
      arity: outgoing.length,
      tv: tv ?? createDefaultTruthValue(),
      av: av ?? createDefaultAttentionValue(),
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    };
    
    // Store in indexes
    this.atoms.set(handle, link);
    this.addToTypeIndex(type, handle);
    
    // Update incoming sets for target atoms
    for (const target of outgoing) {
      this.addToIncomingIndex(target.handle, handle);
    }
    
    return link;
  }
  
  /**
   * Get node by type and name
   */
  getNode(type: AtomType, name: string): Node | null {
    const nameMatches = this.nameIndex.get(name);
    if (!nameMatches) return null;
    
    for (const handle of nameMatches) {
      const atom = this.atoms.get(handle);
      if (atom && atom.type === type) {
        atom.lastAccessed = Date.now();
        return atom as Node;
      }
    }
    
    return null;
  }
  
  /**
   * Get link by type and outgoing set
   */
  getLink(type: AtomType, outgoing: Atom[]): Link | null {
    const typeMatches = this.typeIndex.get(type);
    if (!typeMatches) return null;
    
    for (const handle of typeMatches) {
      const atom = this.atoms.get(handle) as Link;
      if (atom && this.matchesOutgoing(atom, outgoing)) {
        atom.lastAccessed = Date.now();
        return atom;
      }
    }
    
    return null;
  }
  
  /**
   * Get atom by handle
   */
  getAtom(handle: string): Atom | null {
    const atom = this.atoms.get(handle) ?? null;
    if (atom) {
      atom.lastAccessed = Date.now();
    }
    return atom;
  }
  
  /**
   * Get all atoms of a given type
   */
  getAtomsByType(type: AtomType): Atom[] {
    const handles = this.typeIndex.get(type);
    if (!handles) return [];
    
    return Array.from(handles)
      .map((h) => this.atoms.get(h))
      .filter((a): a is Atom => a !== undefined);
  }
  
  /**
   * Get incoming set for an atom (atoms that reference it)
   */
  getIncoming(atom: Atom): Link[] {
    const incomingHandles = this.incomingIndex.get(atom.handle);
    if (!incomingHandles) return [];
    
    return Array.from(incomingHandles)
      .map((h) => this.atoms.get(h))
      .filter((a): a is Link => a !== undefined && "outgoing" in a);
  }
  
  /**
   * Query atoms by pattern matching
   */
  query(pattern: Partial<Atom>): Atom[] {
    let results: Atom[] = Array.from(this.atoms.values());
    
    if (pattern.type) {
      results = results.filter((a) => a.type === pattern.type);
    }
    
    if (pattern.name) {
      results = results.filter((a) => a.name === pattern.name);
    }
    
    return results;
  }
  
  /**
   * Get atoms with highest attention (attentional focus)
   */
  getAttentionalFocus(limit: number = 20): Atom[] {
    return Array.from(this.atoms.values())
      .sort((a, b) => b.av.sti - a.av.sti)
      .slice(0, limit);
  }
  
  /**
   * Execute a cognitive cycle (ECAN)
   * - Decay attention values
   * - Spread importance
   * - Update attentional focus
   */
  executeCognitiveCycle(): void {
    this.cycleCount++;
    
    // Decay attention values
    if (this.config.enableAttentionDecay) {
      for (const atom of this.atoms.values()) {
        atom.av = decayAttentionValue(atom.av, this.config.attentionDecayRate);
      }
    }
    
    // Spread attention along links (importance spreading)
    if (this.config.enableAttentionSpreading) {
      const focus = this.getAttentionalFocus(10);
      for (const atom of focus) {
        const incoming = this.getIncoming(atom);
        const outgoing = "outgoing" in atom ? (atom as Link).outgoing : [];
        
        // Spread to connected atoms
        const spreadAmount = atom.av.sti * 0.1; // Spread 10% of STI
        for (const link of incoming) {
          link.av.sti += spreadAmount / incoming.length;
        }
        for (const target of outgoing) {
          target.av.sti += spreadAmount / outgoing.length;
        }
      }
    }
  }
  
  /**
   * Get statistics about the AtomSpace
   */
  getStatistics(): {
    totalAtoms: number;
    nodeCount: number;
    linkCount: number;
    cycles: number;
    averageSTI: number;
    maxSTI: number;
  } {
    let nodeCount = 0;
    let linkCount = 0;
    let totalSTI = 0;
    let maxSTI = 0;
    
    for (const atom of this.atoms.values()) {
      if ("outgoing" in atom) {
        linkCount++;
      } else {
        nodeCount++;
      }
      totalSTI += atom.av.sti;
      maxSTI = Math.max(maxSTI, atom.av.sti);
    }
    
    return {
      totalAtoms: this.atoms.size,
      nodeCount,
      linkCount,
      cycles: this.cycleCount,
      averageSTI: this.atoms.size > 0 ? totalSTI / this.atoms.size : 0,
      maxSTI,
    };
  }
  
  /**
   * Clear all atoms from the AtomSpace
   */
  clear(): void {
    this.atoms.clear();
    this.typeIndex.clear();
    this.nameIndex.clear();
    this.incomingIndex.clear();
    this.cycleCount = 0;
  }
  
  // Private helper methods
  
  private addToTypeIndex(type: AtomType, handle: string): void {
    if (!this.typeIndex.has(type)) {
      this.typeIndex.set(type, new Set());
    }
    this.typeIndex.get(type)!.add(handle);
  }
  
  private addToNameIndex(name: string, handle: string): void {
    if (!this.nameIndex.has(name)) {
      this.nameIndex.set(name, new Set());
    }
    this.nameIndex.get(name)!.add(handle);
  }
  
  private addToIncomingIndex(targetHandle: string, linkHandle: string): void {
    if (!this.incomingIndex.has(targetHandle)) {
      this.incomingIndex.set(targetHandle, new Set());
    }
    this.incomingIndex.get(targetHandle)!.add(linkHandle);
  }
  
  private matchesOutgoing(link: Link, outgoing: Atom[]): boolean {
    if (link.arity !== outgoing.length) return false;
    
    for (let i = 0; i < outgoing.length; i++) {
      if (link.outgoing[i].handle !== outgoing[i].handle) {
        return false;
      }
    }
    
    return true;
  }
}
