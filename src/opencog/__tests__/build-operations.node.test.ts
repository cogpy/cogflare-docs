/**
 * Tests for Cognitive Build Operations
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CognitiveBuildOperations, BuildStatus, BuildPhase } from "../operations/build-operations";
import type { DocsPage } from "../operations/build-operations";

describe("CognitiveBuildOperations", () => {
  let buildOps: CognitiveBuildOperations;

  beforeEach(() => {
    buildOps = new CognitiveBuildOperations();
  });

  describe("Build Lifecycle", () => {
    it("should start a build successfully", () => {
      buildOps.startBuild();

      const state = buildOps.getBuildState();
      expect(state.status).toBe(BuildStatus.IN_PROGRESS);
      expect(state.currentPhase).toBe(BuildPhase.INITIALIZATION);
      expect(state.startTime).toBeDefined();
      expect(state.errors).toHaveLength(0);
    });

    it("should throw error when starting build twice", () => {
      buildOps.startBuild();

      expect(() => buildOps.startBuild()).toThrow("Build already started");
    });

    it("should complete build successfully", () => {
      buildOps.startBuild();
      buildOps.completeBuild(true);

      const state = buildOps.getBuildState();
      expect(state.status).toBe(BuildStatus.COMPLETED);
      expect(state.endTime).toBeDefined();
    });

    it("should mark build as failed", () => {
      buildOps.startBuild();
      buildOps.completeBuild(false);

      const state = buildOps.getBuildState();
      expect(state.status).toBe(BuildStatus.FAILED);
    });
  });

  describe("Content Loading", () => {
    it("should load content pages", () => {
      buildOps.startBuild();

      const paths = [
        "src/content/docs/workers/get-started.mdx",
        "src/content/docs/workers/configuration.mdx",
      ];

      const pages = buildOps.loadContent(paths);

      expect(pages).toHaveLength(2);
      expect(pages[0].filePath).toBe(paths[0]);
      expect(pages[1].filePath).toBe(paths[1]);
    });

    it("should throw error when loading without starting build", () => {
      expect(() => buildOps.loadContent(["test.mdx"])).toThrow("Build not in progress");
    });
  });

  describe("Schema Validation", () => {
    it("should validate valid page", () => {
      buildOps.startBuild();

      const validPage: DocsPage = {
        title: "Test Page",
        slug: "test-page",
        content: "Test content",
        filePath: "test.mdx",
      };

      const result = buildOps.validateSchema(validPage);

      expect(result.valid).toBe(true);
      expect(result.validationErrors).toHaveLength(0);
    });

    it("should detect missing title", () => {
      buildOps.startBuild();

      const invalidPage: DocsPage = {
        title: "",
        slug: "test-page",
        content: "Test content",
        filePath: "test.mdx",
      };

      const result = buildOps.validateSchema(invalidPage);

      expect(result.valid).toBe(false);
      expect(result.validationErrors).toContain("Missing title");
    });

    it("should detect missing content", () => {
      buildOps.startBuild();

      const invalidPage: DocsPage = {
        title: "Test",
        slug: "test-page",
        content: "",
        filePath: "test.mdx",
      };

      const result = buildOps.validateSchema(invalidPage);

      expect(result.valid).toBe(false);
      expect(result.validationErrors).toContain("Missing content");
    });

    it("should detect invalid sidebar order", () => {
      buildOps.startBuild();

      const invalidPage: DocsPage = {
        title: "Test",
        slug: "test-page",
        content: "Content",
        filePath: "test.mdx",
        sidebar: {
          order: -1,
        },
      };

      const result = buildOps.validateSchema(invalidPage);

      expect(result.valid).toBe(false);
      expect(result.validationErrors).toContain("Invalid sidebar order");
    });
  });

  describe("Markdown Processing", () => {
    it("should process markdown content", () => {
      buildOps.startBuild();

      const markdown = "# Test\n\nContent here";
      const html = buildOps.processMarkdown(markdown, "test.mdx");

      expect(html).toBeDefined();
      expect(html).toContain("div");
    });
  });

  describe("Asset Generation", () => {
    it("should generate static assets", () => {
      buildOps.startBuild();

      const pages: DocsPage[] = [
        {
          title: "Page 1",
          slug: "page-1",
          content: "Content 1",
          filePath: "page1.mdx",
        },
        {
          title: "Page 2",
          slug: "page-2",
          content: "Content 2",
          filePath: "page2.mdx",
        },
      ];

      const assets = buildOps.generateStaticAssets(pages);

      expect(assets.size).toBe(2);
      expect(assets.has("page-1/index.html")).toBe(true);
      expect(assets.has("page-2/index.html")).toBe(true);
    });
  });

  describe("Cognitive Integration", () => {
    it("should track atoms in AtomSpace", () => {
      buildOps.startBuild();

      const atomSpace = buildOps.getAtomSpace();
      const initialStats = atomSpace.getStatistics();

      // Load some content
      buildOps.loadContent(["test1.mdx", "test2.mdx"]);

      const afterLoadStats = atomSpace.getStatistics();
      expect(afterLoadStats.totalAtoms).toBeGreaterThan(initialStats.totalAtoms);
    });

    it("should execute cognitive cycles", () => {
      buildOps.startBuild();
      buildOps.loadContent(["test.mdx"]);

      const atomSpace = buildOps.getAtomSpace();
      const initialCycles = atomSpace.getStatistics().cycles;

      buildOps.executeCognitiveCycle();

      const afterCycles = atomSpace.getStatistics().cycles;
      expect(afterCycles).toBe(initialCycles + 1);
    });

    it("should provide cognitive statistics", () => {
      buildOps.startBuild();
      buildOps.loadContent(["test.mdx"]);

      const stats = buildOps.getCognitiveStatistics();

      expect(stats.atomSpace).toBeDefined();
      expect(stats.atomSpace.totalAtoms).toBeGreaterThan(0);
      expect(stats.ecan).toBeDefined();
    });
  });

  describe("Complete Build Flow", () => {
    it("should execute complete build process", () => {
      // 1. Start
      buildOps.startBuild();
      expect(buildOps.getBuildState().status).toBe(BuildStatus.IN_PROGRESS);

      // 2. Load content
      const pages = buildOps.loadContent(["page1.mdx", "page2.mdx"]);
      expect(pages).toHaveLength(2);

      // 3. Validate
      for (const page of pages) {
        const result = buildOps.validateSchema(page);
        expect(result.valid).toBe(true);
      }

      // 4. Process markdown
      for (const page of pages) {
        const html = buildOps.processMarkdown(page.content, page.filePath);
        expect(html).toBeDefined();
      }

      // 5. Generate assets
      const assets = buildOps.generateStaticAssets(pages);
      expect(assets.size).toBe(2);

      // 6. Complete
      buildOps.completeBuild(true);
      expect(buildOps.getBuildState().status).toBe(BuildStatus.COMPLETED);

      // Check cognitive state
      const stats = buildOps.getCognitiveStatistics();
      expect(stats.atomSpace.totalAtoms).toBeGreaterThan(0);
    });
  });
});
