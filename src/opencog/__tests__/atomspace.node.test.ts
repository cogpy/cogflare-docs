/**
 * Tests for OpenCog AtomSpace implementation
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AtomSpace } from "../atomspace/atomspace";
import { AtomType } from "../atomspace/atom";
import type { Node, Link } from "../atomspace/atom";

describe("AtomSpace", () => {
  let atomSpace: AtomSpace;

  beforeEach(() => {
    atomSpace = new AtomSpace();
  });

  describe("Node Operations", () => {
    it("should add a node to the AtomSpace", () => {
      const node = atomSpace.addNode(AtomType.CONCEPT_NODE, "TestConcept");

      expect(node).toBeDefined();
      expect(node.type).toBe(AtomType.CONCEPT_NODE);
      expect(node.name).toBe("TestConcept");
      expect(node.handle).toBeDefined();
    });

    it("should return existing node when adding duplicate", () => {
      const node1 = atomSpace.addNode(AtomType.CONCEPT_NODE, "TestConcept");
      const node2 = atomSpace.addNode(AtomType.CONCEPT_NODE, "TestConcept");

      expect(node1.handle).toBe(node2.handle);
    });

    it("should get node by type and name", () => {
      const originalNode = atomSpace.addNode(AtomType.DOC_PAGE_NODE, "test-page");
      const retrievedNode = atomSpace.getNode(AtomType.DOC_PAGE_NODE, "test-page");

      expect(retrievedNode).toBeDefined();
      expect(retrievedNode?.handle).toBe(originalNode.handle);
    });

    it("should return null for non-existent node", () => {
      const node = atomSpace.getNode(AtomType.CONCEPT_NODE, "NonExistent");
      expect(node).toBeNull();
    });
  });

  describe("Link Operations", () => {
    it("should add a link between nodes", () => {
      const node1 = atomSpace.addNode(AtomType.CONCEPT_NODE, "A");
      const node2 = atomSpace.addNode(AtomType.CONCEPT_NODE, "B");

      const link = atomSpace.addLink(
        AtomType.INHERITANCE_LINK,
        [node1, node2],
      );

      expect(link).toBeDefined();
      expect(link.type).toBe(AtomType.INHERITANCE_LINK);
      expect(link.arity).toBe(2);
      expect(link.outgoing).toHaveLength(2);
      expect(link.outgoing[0].handle).toBe(node1.handle);
      expect(link.outgoing[1].handle).toBe(node2.handle);
    });

    it("should get incoming links for a node", () => {
      const node1 = atomSpace.addNode(AtomType.CONCEPT_NODE, "A");
      const node2 = atomSpace.addNode(AtomType.CONCEPT_NODE, "B");

      atomSpace.addLink(AtomType.INHERITANCE_LINK, [node1, node2]);

      const incoming = atomSpace.getIncoming(node2);
      expect(incoming).toHaveLength(1);
      expect(incoming[0].type).toBe(AtomType.INHERITANCE_LINK);
    });
  });

  describe("Truth Values", () => {
    it("should merge truth values when adding duplicate atoms", () => {
      const tv1 = { strength: 0.8, confidence: 0.6 };
      const tv2 = { strength: 0.9, confidence: 0.7 };

      atomSpace.addNode(AtomType.CONCEPT_NODE, "TestNode", tv1);
      const node2 = atomSpace.addNode(AtomType.CONCEPT_NODE, "TestNode", tv2);

      // Truth value should be revised
      expect(node2.tv.strength).toBeGreaterThan(0.8);
      expect(node2.tv.strength).toBeLessThan(0.9);
    });
  });

  describe("Attention Values", () => {
    it("should assign default attention values to atoms", () => {
      const node = atomSpace.addNode(AtomType.CONCEPT_NODE, "TestNode");

      expect(node.av).toBeDefined();
      expect(node.av.sti).toBeGreaterThan(0);
      expect(node.av.lti).toBeGreaterThanOrEqual(0);
      expect(node.av.vlti).toBeGreaterThanOrEqual(0);
    });

    it("should get attentional focus", () => {
      // Add nodes with different attention values
      for (let i = 0; i < 10; i++) {
        const node = atomSpace.addNode(
          AtomType.CONCEPT_NODE,
          `Node${i}`,
          undefined,
          { sti: i * 10, lti: 0, vlti: 0 },
        );
      }

      const focus = atomSpace.getAttentionalFocus(3);
      expect(focus).toHaveLength(3);
      // Should be sorted by STI (highest first)
      expect(focus[0].av.sti).toBeGreaterThan(focus[1].av.sti);
      expect(focus[1].av.sti).toBeGreaterThan(focus[2].av.sti);
    });
  });

  describe("Query Operations", () => {
    it("should query atoms by type", () => {
      atomSpace.addNode(AtomType.CONCEPT_NODE, "A");
      atomSpace.addNode(AtomType.CONCEPT_NODE, "B");
      atomSpace.addNode(AtomType.PREDICATE_NODE, "C");

      const concepts = atomSpace.getAtomsByType(AtomType.CONCEPT_NODE);
      expect(concepts).toHaveLength(2);
    });

    it("should query atoms by pattern", () => {
      atomSpace.addNode(AtomType.CONCEPT_NODE, "TestA");
      atomSpace.addNode(AtomType.CONCEPT_NODE, "TestB");
      atomSpace.addNode(AtomType.PREDICATE_NODE, "TestC");

      const results = atomSpace.query({ type: AtomType.CONCEPT_NODE });
      expect(results).toHaveLength(2);
    });
  });

  describe("Cognitive Cycle", () => {
    it("should decay attention values during cognitive cycle", () => {
      const node = atomSpace.addNode(
        AtomType.CONCEPT_NODE,
        "TestNode",
        undefined,
        { sti: 100, lti: 10, vlti: 0 },
      );

      const initialSTI = node.av.sti;
      atomSpace.executeCognitiveCycle();

      expect(node.av.sti).toBeLessThan(initialSTI);
    });

    it("should spread attention along links", () => {
      const node1 = atomSpace.addNode(
        AtomType.CONCEPT_NODE,
        "HighAttention",
        undefined,
        { sti: 100, lti: 0, vlti: 0 },
      );

      const node2 = atomSpace.addNode(
        AtomType.CONCEPT_NODE,
        "LowAttention",
        undefined,
        { sti: 10, lti: 0, vlti: 0 },
      );

      atomSpace.addLink(AtomType.SIMILARITY_LINK, [node1, node2]);

      const initialSTI2 = node2.av.sti;
      atomSpace.executeCognitiveCycle();

      // node2 should receive attention spread from node1
      expect(node2.av.sti).toBeGreaterThan(initialSTI2);
    });
  });

  describe("Statistics", () => {
    it("should provide accurate statistics", () => {
      atomSpace.addNode(AtomType.CONCEPT_NODE, "A");
      atomSpace.addNode(AtomType.CONCEPT_NODE, "B");
      const node1 = atomSpace.addNode(AtomType.CONCEPT_NODE, "C");
      const node2 = atomSpace.addNode(AtomType.CONCEPT_NODE, "D");
      atomSpace.addLink(AtomType.INHERITANCE_LINK, [node1, node2]);

      const stats = atomSpace.getStatistics();
      expect(stats.totalAtoms).toBe(5);
      expect(stats.nodeCount).toBe(4);
      expect(stats.linkCount).toBe(1);
    });
  });

  describe("Clear Operation", () => {
    it("should clear all atoms", () => {
      atomSpace.addNode(AtomType.CONCEPT_NODE, "A");
      atomSpace.addNode(AtomType.CONCEPT_NODE, "B");

      atomSpace.clear();

      const stats = atomSpace.getStatistics();
      expect(stats.totalAtoms).toBe(0);
    });
  });
});
