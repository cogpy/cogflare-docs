/**
 * PLN - Probabilistic Logic Networks
 * 
 * Implements uncertain reasoning for the OpenCog cognitive architecture.
 * Provides inference rules for handling probabilistic and uncertain knowledge.
 */

import type { Atom, Link, TruthValue } from "../atomspace/atom";
import { AtomType } from "../atomspace/atom";

/**
 * PLN Inference Rules
 */
export class PLNReasoner {
  /**
   * Deduction Rule: (A→B) ∧ (B→C) ⇒ (A→C)
   * If A implies B with TV1 and B implies C with TV2,
   * then A implies C with the deduced TV
   */
  deduction(
    ab: TruthValue,  // A→B truth value
    bc: TruthValue,  // B→C truth value
  ): TruthValue {
    // Simplified deduction formula
    const strength = ab.strength * bc.strength;
    const confidence = Math.min(ab.confidence, bc.confidence) * 0.9;
    
    return { strength, confidence };
  }
  
  /**
   * Induction Rule: A→B ⇒ B→A
   * Symmetric reasoning (weaker than deduction)
   */
  induction(ab: TruthValue): TruthValue {
    // Induction is weaker than the original implication
    const strength = ab.strength * 0.8;
    const confidence = ab.confidence * 0.7;
    
    return { strength, confidence };
  }
  
  /**
   * Abduction Rule: (A→B) ∧ B ⇒ A
   * Backward reasoning from effect to cause
   */
  abduction(
    ab: TruthValue,  // A→B
    b: TruthValue,   // B is true
  ): TruthValue {
    // Abduction strength based on both values
    const strength = ab.strength * b.strength * 0.7;
    const confidence = Math.min(ab.confidence, b.confidence) * 0.6;
    
    return { strength, confidence };
  }
  
  /**
   * AND Rule: A ∧ B
   * Compute truth value of conjunction
   */
  and(a: TruthValue, b: TruthValue): TruthValue {
    const strength = a.strength * b.strength;
    const confidence = Math.min(a.confidence, b.confidence);
    
    return { strength, confidence };
  }
  
  /**
   * OR Rule: A ∨ B
   * Compute truth value of disjunction
   */
  or(a: TruthValue, b: TruthValue): TruthValue {
    const strength = a.strength + b.strength - (a.strength * b.strength);
    const confidence = Math.min(a.confidence, b.confidence);
    
    return { strength, confidence };
  }
  
  /**
   * NOT Rule: ¬A
   * Compute truth value of negation
   */
  not(a: TruthValue): TruthValue {
    return {
      strength: 1 - a.strength,
      confidence: a.confidence,
    };
  }
  
  /**
   * Similarity: sim(A, B)
   * Compute similarity between two concepts based on common properties
   */
  similarity(
    a: TruthValue,  // A's properties
    b: TruthValue,  // B's properties
    common: number, // Proportion of common properties
  ): TruthValue {
    const strength = common * Math.min(a.strength, b.strength);
    const confidence = Math.min(a.confidence, b.confidence);
    
    return { strength, confidence };
  }
  
  /**
   * Inheritance Strength: inh(A, B)
   * A inherits from B
   */
  inheritance(
    subset: TruthValue,  // A is subset of B
    typicality: number,  // How typical A is of B
  ): TruthValue {
    const strength = subset.strength * typicality;
    const confidence = subset.confidence * 0.9;
    
    return { strength, confidence };
  }
  
  /**
   * Revision Rule: Merge evidence from multiple sources
   */
  revision(tv1: TruthValue, tv2: TruthValue): TruthValue {
    const w1 = tv1.confidence * (tv1.count || 1);
    const w2 = tv2.confidence * (tv2.count || 1);
    const wTotal = w1 + w2;
    
    if (wTotal === 0) {
      return { strength: 0.5, confidence: 0 };
    }
    
    const strength = (w1 * tv1.strength + w2 * tv2.strength) / wTotal;
    const count = (tv1.count || 1) + (tv2.count || 1);
    const confidence = Math.min(0.99, wTotal / (wTotal + 1));
    
    return { strength, confidence, count };
  }
  
  /**
   * Bayes Rule: P(A|B) from P(B|A), P(A), P(B)
   */
  bayes(
    ba: TruthValue,   // P(B|A)
    priorA: number,   // P(A)
    priorB: number,   // P(B)
  ): TruthValue {
    if (priorB === 0) {
      return { strength: 0, confidence: 0 };
    }
    
    const strength = (ba.strength * priorA) / priorB;
    const confidence = ba.confidence * 0.9;
    
    return { strength, confidence };
  }
}

/**
 * Pattern Matcher - Find patterns in the AtomSpace
 */
export class PatternMatcher {
  /**
   * Check if two atoms match (unification)
   */
  match(pattern: Partial<Atom>, target: Atom): boolean {
    if (pattern.type && pattern.type !== target.type) {
      return false;
    }
    
    if (pattern.name && pattern.name !== target.name) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Match a link pattern with variable binding
   */
  matchLink(
    pattern: Partial<Link>,
    target: Link,
    bindings: Map<string, Atom>,
  ): boolean {
    if (pattern.type && pattern.type !== target.type) {
      return false;
    }
    
    if (pattern.outgoing && target.outgoing) {
      if (pattern.outgoing.length !== target.outgoing.length) {
        return false;
      }
      
      for (let i = 0; i < pattern.outgoing.length; i++) {
        const pAtom = pattern.outgoing[i];
        const tAtom = target.outgoing[i];
        
        // Check if pattern atom is a variable
        if (pAtom.name.startsWith("$")) {
          const existing = bindings.get(pAtom.name);
          if (existing && existing.handle !== tAtom.handle) {
            return false;
          }
          bindings.set(pAtom.name, tAtom);
        } else if (!this.match(pAtom, tAtom)) {
          return false;
        }
      }
    }
    
    return true;
  }
}

/**
 * Knowledge Query Interface
 */
export interface KnowledgeQuery {
  /** Query type */
  type: "deduction" | "induction" | "similarity" | "pattern";
  
  /** Source atoms */
  premises: Atom[];
  
  /** Expected result type */
  expectedType?: AtomType;
  
  /** Minimum confidence threshold */
  minConfidence?: number;
}

/**
 * Query Result
 */
export interface QueryResult {
  /** Resulting atom */
  atom: Atom;
  
  /** Inference path */
  path: Atom[];
  
  /** Confidence score */
  score: number;
}

/**
 * PLN Query Engine
 */
export class PLNQueryEngine {
  private reasoner: PLNReasoner;
  private matcher: PatternMatcher;
  
  constructor() {
    this.reasoner = new PLNReasoner();
    this.matcher = new PatternMatcher();
  }
  
  /**
   * Execute a knowledge query
   */
  query(query: KnowledgeQuery, atoms: Atom[]): QueryResult[] {
    const results: QueryResult[] = [];
    
    switch (query.type) {
      case "deduction":
        // Find deduction chains
        if (query.premises.length >= 2) {
          const deduced = this.findDeductions(query.premises, atoms);
          results.push(...deduced);
        }
        break;
      
      case "similarity":
        // Find similar atoms
        const similar = this.findSimilar(query.premises[0], atoms);
        results.push(...similar);
        break;
      
      case "pattern":
        // Pattern matching
        const matches = this.findPatternMatches(query.premises[0], atoms);
        results.push(...matches);
        break;
    }
    
    // Filter by confidence
    const minConf = query.minConfidence ?? 0.5;
    return results.filter((r) => r.score >= minConf);
  }
  
  private findDeductions(premises: Atom[], atoms: Atom[]): QueryResult[] {
    const results: QueryResult[] = [];
    
    // Simplified deduction finding
    // In full implementation, would search for chains A→B, B→C
    
    return results;
  }
  
  private findSimilar(target: Atom, atoms: Atom[]): QueryResult[] {
    const results: QueryResult[] = [];
    
    for (const atom of atoms) {
      if (atom.handle === target.handle) continue;
      
      // Compute similarity score
      const score = this.computeSimilarity(target, atom);
      if (score > 0.5) {
        results.push({
          atom,
          path: [target, atom],
          score,
        });
      }
    }
    
    return results;
  }
  
  private findPatternMatches(pattern: Atom, atoms: Atom[]): QueryResult[] {
    const results: QueryResult[] = [];
    
    for (const atom of atoms) {
      if (this.matcher.match(pattern, atom)) {
        results.push({
          atom,
          path: [pattern, atom],
          score: atom.tv.confidence,
        });
      }
    }
    
    return results;
  }
  
  private computeSimilarity(a: Atom, b: Atom): number {
    // Simple similarity based on name and type
    let score = a.type === b.type ? 0.5 : 0;
    
    if (a.name && b.name) {
      const common = this.commonSubstring(a.name, b.name);
      score += (common / Math.max(a.name.length, b.name.length)) * 0.5;
    }
    
    return score;
  }
  
  private commonSubstring(s1: string, s2: string): number {
    let common = 0;
    const minLen = Math.min(s1.length, s2.length);
    
    for (let i = 0; i < minLen; i++) {
      if (s1[i] === s2[i]) common++;
    }
    
    return common;
  }
}
