/**
 * AtomSpace Core Types - OpenCog Knowledge Representation
 * 
 * Implements the foundational hypergraph knowledge structure for CogPrime
 * cognitive architecture integration with the documentation platform.
 */

/**
 * Atom Types - Core node and link types in the hypergraph
 */
export enum AtomType {
  // Node types - represent entities
  CONCEPT_NODE = "ConceptNode",
  PREDICATE_NODE = "PredicateNode",
  SCHEMA_NODE = "SchemaNode",
  GROUNDED_SCHEMA_NODE = "GroundedSchemaNode",
  
  // Documentation-specific nodes
  DOC_PAGE_NODE = "DocPageNode",
  PRODUCT_NODE = "ProductNode",
  CONTENT_TYPE_NODE = "ContentTypeNode",
  SLUG_NODE = "SlugNode",
  
  // Link types - represent relationships
  INHERITANCE_LINK = "InheritanceLink",
  SIMILARITY_LINK = "SimilarityLink",
  EVALUATION_LINK = "EvaluationLink",
  EXECUTION_LINK = "ExecutionLink",
  MEMBER_LINK = "MemberLink",
  
  // Documentation-specific links
  REFERENCES_LINK = "ReferencesLink",
  HAS_PRODUCT_LINK = "HasProductLink",
  HAS_CONTENT_TYPE_LINK = "HasContentTypeLink",
  NAVIGATION_LINK = "NavigationLink",
}

/**
 * Truth Value - Uncertain logic representation
 * Implements PLN (Probabilistic Logic Networks) truth values
 */
export interface TruthValue {
  /** Strength: probability/confidence in [0, 1] */
  strength: number;
  
  /** Confidence: weight of evidence in [0, 1] */
  confidence: number;
  
  /** Count: amount of evidence (optional) */
  count?: number;
}

/**
 * Attention Value - ECAN (Economic Attention Networks)
 * Manages cognitive resource allocation
 */
export interface AttentionValue {
  /** Short-term importance (STI) - current relevance */
  sti: number;
  
  /** Long-term importance (LTI) - persistent relevance */
  lti: number;
  
  /** Very-long-term importance (VLTI) - stable importance */
  vlti: number;
}

/**
 * Base Atom interface - all atoms inherit from this
 */
export interface Atom {
  /** Unique identifier */
  handle: string;
  
  /** Atom type */
  type: AtomType;
  
  /** Name/value for nodes, empty for links */
  name: string;
  
  /** Truth value for uncertain reasoning */
  tv: TruthValue;
  
  /** Attention value for resource allocation */
  av: AttentionValue;
  
  /** Creation timestamp */
  createdAt: number;
  
  /** Last access timestamp */
  lastAccessed: number;
}

/**
 * Node - represents entities in the knowledge graph
 */
export interface Node extends Atom {
  /** Node-specific type constraint */
  type: AtomType.CONCEPT_NODE | AtomType.PREDICATE_NODE | AtomType.SCHEMA_NODE | 
        AtomType.GROUNDED_SCHEMA_NODE | AtomType.DOC_PAGE_NODE | AtomType.PRODUCT_NODE |
        AtomType.CONTENT_TYPE_NODE | AtomType.SLUG_NODE;
}

/**
 * Link - represents relationships in the knowledge graph
 */
export interface Link extends Atom {
  /** Link-specific type constraint */
  type: AtomType.INHERITANCE_LINK | AtomType.SIMILARITY_LINK | AtomType.EVALUATION_LINK |
        AtomType.EXECUTION_LINK | AtomType.MEMBER_LINK | AtomType.REFERENCES_LINK |
        AtomType.HAS_PRODUCT_LINK | AtomType.HAS_CONTENT_TYPE_LINK | AtomType.NAVIGATION_LINK;
  
  /** Outgoing set - atoms this link connects */
  outgoing: Atom[];
  
  /** Arity - number of outgoing atoms */
  arity: number;
}

/**
 * Create a default truth value (high strength, moderate confidence)
 */
export function createDefaultTruthValue(): TruthValue {
  return {
    strength: 0.8,
    confidence: 0.6,
    count: 1,
  };
}

/**
 * Create a default attention value (moderate STI, low LTI/VLTI)
 */
export function createDefaultAttentionValue(): AttentionValue {
  return {
    sti: 50,
    lti: 10,
    vlti: 0,
  };
}

/**
 * Generate unique handle for atoms
 */
export function generateHandle(): string {
  return `atom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Update truth value using PLN revision rule
 * Combines evidence from two truth values
 */
export function revisionTruthValue(tv1: TruthValue, tv2: TruthValue): TruthValue {
  const w1 = tv1.confidence * (tv1.count || 1);
  const w2 = tv2.confidence * (tv2.count || 1);
  const wTotal = w1 + w2;
  
  if (wTotal === 0) {
    return createDefaultTruthValue();
  }
  
  const strength = (w1 * tv1.strength + w2 * tv2.strength) / wTotal;
  const count = (tv1.count || 1) + (tv2.count || 1);
  const confidence = Math.min(0.99, wTotal / (wTotal + 1));
  
  return { strength, confidence, count };
}

/**
 * Decay attention value over time (forgetting mechanism)
 */
export function decayAttentionValue(av: AttentionValue, decayRate: number = 0.05): AttentionValue {
  return {
    sti: Math.max(0, av.sti * (1 - decayRate)),
    lti: av.lti, // LTI doesn't decay
    vlti: av.vlti, // VLTI is stable
  };
}

/**
 * Spread attention (importance spreading in ECAN)
 */
export function spreadAttention(source: AttentionValue, target: AttentionValue, amount: number): AttentionValue {
  return {
    sti: target.sti + amount,
    lti: target.lti,
    vlti: target.vlti,
  };
}
