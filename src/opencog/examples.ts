/**
 * Integration Example - Using OpenCog Extensions
 * 
 * This example demonstrates how to integrate the OpenCog cognitive architecture
 * with the Cloudflare documentation platform.
 */

import { CogPrime, getCogPrime, AtomType } from "./index";

/**
 * Example 1: Basic AtomSpace Usage
 * Add documentation pages to knowledge graph
 */
export function example1_BasicKnowledgeGraph() {
  console.log("\n=== Example 1: Basic Knowledge Graph ===");
  
  const cogprime = getCogPrime();
  const atomSpace = cogprime.getAtomSpace();
  
  // Add documentation pages as nodes
  const workersPage = atomSpace.addNode(
    AtomType.DOC_PAGE_NODE,
    "workers-get-started",
  );
  
  const pagesPage = atomSpace.addNode(
    AtomType.DOC_PAGE_NODE,
    "pages-get-started",
  );
  
  // Add product nodes
  const workersProduct = atomSpace.addNode(
    AtomType.PRODUCT_NODE,
    "workers",
  );
  
  const pagesProduct = atomSpace.addNode(
    AtomType.PRODUCT_NODE,
    "pages",
  );
  
  // Link pages to products
  atomSpace.addLink(
    AtomType.HAS_PRODUCT_LINK,
    [workersPage, workersProduct],
  );
  
  atomSpace.addLink(
    AtomType.HAS_PRODUCT_LINK,
    [pagesPage, pagesProduct],
  );
  
  // Add similarity link (both are getting started guides)
  atomSpace.addLink(
    AtomType.SIMILARITY_LINK,
    [workersPage, pagesPage],
    { strength: 0.75, confidence: 0.8 },
  );
  
  const stats = atomSpace.getStatistics();
  console.log(`Created knowledge graph with ${stats.totalAtoms} atoms`);
  console.log(`Nodes: ${stats.nodeCount}, Links: ${stats.linkCount}`);
}

/**
 * Example 2: Build Process with Cognitive Integration
 * Use cognitive build operations
 */
export function example2_CognitiveBuildProcess() {
  console.log("\n=== Example 2: Cognitive Build Process ===");
  
  const cogprime = getCogPrime();
  const buildOps = cogprime.getBuildOperations();
  
  // 1. Start build
  buildOps.startBuild();
  console.log("Build started");
  
  // 2. Load content
  const pages = buildOps.loadContent([
    "src/content/docs/workers/get-started.mdx",
    "src/content/docs/workers/configuration.mdx",
    "src/content/docs/workers/runtime-apis.mdx",
  ]);
  console.log(`Loaded ${pages.length} pages`);
  
  // 3. Validate schemas
  let validCount = 0;
  for (const page of pages) {
    const { valid } = buildOps.validateSchema(page);
    if (valid) validCount++;
  }
  console.log(`Validated: ${validCount}/${pages.length} pages passed`);
  
  // 4. Process markdown
  for (const page of pages) {
    buildOps.processMarkdown(page.content, page.filePath);
  }
  console.log("Processed all markdown");
  
  // 5. Generate assets
  const assets = buildOps.generateStaticAssets(pages);
  console.log(`Generated ${assets.size} static assets`);
  
  // 6. Complete build
  buildOps.completeBuild(true);
  console.log("Build completed");
  
  // Check cognitive statistics
  const stats = buildOps.getCognitiveStatistics();
  console.log(`AtomSpace: ${stats.atomSpace.totalAtoms} atoms`);
  console.log(`ECAN focus: ${stats.ecan.atomSpaceStats.averageSTI.toFixed(2)} avg STI`);
}

/**
 * Example 3: Worker Request Handling with Attention
 * Process HTTP requests with cognitive attention
 */
export function example3_CognitiveWorkerOps() {
  console.log("\n=== Example 3: Cognitive Worker Operations ===");
  
  const cogprime = getCogPrime();
  const workerOps = cogprime.getWorkerOperations();
  
  // Initialize with redirects
  workerOps.initializeWorker(`
/old-workers-path /workers/get-started 301
/legacy-pages /pages/get-started 302
`);
  
  console.log("Worker initialized with redirects");
  
  // Handle various requests
  const requests = [
    { method: "GET", url: "https://example.com/workers/get-started", path: "/workers/get-started", headers: {} },
    { method: "GET", url: "https://example.com/old-workers-path", path: "/old-workers-path", headers: {} },
    { method: "GET", url: "https://example.com/markdown.zip", path: "/markdown.zip", headers: {} },
  ];
  
  for (const request of requests) {
    const response = workerOps.handleRequest(request);
    console.log(`${request.path} -> ${response.statusCode} ${response.status}`);
  }
  
  // Check statistics
  const stats = workerOps.getWorkerStatistics();
  console.log(`Handled ${stats.requestCount} requests, ${stats.errorCount} errors`);
  console.log(`Cache size: ${stats.cacheSize}, Redirects: ${stats.redirectRules}`);
}

/**
 * Example 4: Attention Dynamics and Cognitive Cycles
 * Demonstrate ECAN attention spreading
 */
export function example4_AttentionDynamics() {
  console.log("\n=== Example 4: Attention Dynamics ===");
  
  const cogprime = getCogPrime();
  const atomSpace = cogprime.getAtomSpace();
  const ecan = cogprime.getECAN();
  
  if (!ecan) {
    console.log("ECAN not enabled");
    return;
  }
  
  // Create a network of related pages
  const pages = [
    "workers-getting-started",
    "workers-configuration",
    "workers-runtime-apis",
    "workers-examples",
  ];
  
  const pageNodes = pages.map((slug) =>
    atomSpace.addNode(AtomType.DOC_PAGE_NODE, slug),
  );
  
  // Link related pages
  for (let i = 0; i < pageNodes.length - 1; i++) {
    atomSpace.addLink(
      AtomType.REFERENCES_LINK,
      [pageNodes[i], pageNodes[i + 1]],
    );
  }
  
  // Stimulate the first page (user is reading it)
  console.log("\nStimulating first page (user reading)...");
  ecan.stimulate(pageNodes[0], 100);
  
  console.log("Initial attention:");
  pageNodes.forEach((node, i) => {
    console.log(`  ${pages[i]}: STI = ${node.av.sti.toFixed(2)}`);
  });
  
  // Execute cognitive cycles to spread attention
  console.log("\nExecuting 3 cognitive cycles...");
  for (let i = 0; i < 3; i++) {
    ecan.executeCycle();
  }
  
  console.log("\nAfter attention spreading:");
  pageNodes.forEach((node, i) => {
    console.log(`  ${pages[i]}: STI = ${node.av.sti.toFixed(2)}`);
  });
  
  console.log("\nAttentional focus (top 2):");
  const focus = cogprime.getAttentionalFocus(2);
  focus.forEach((atom) => {
    console.log(`  ${atom.name}: STI = ${atom.av.sti.toFixed(2)}`);
  });
}

/**
 * Example 5: PLN Reasoning
 * Demonstrate probabilistic inference
 */
export function example5_PLNReasoning() {
  console.log("\n=== Example 5: PLN Reasoning ===");
  
  const cogprime = getCogPrime();
  const pln = cogprime.getPLN();
  
  // Example: Deduction
  // If "Workers are serverless" with TV1
  // And "Serverless is scalable" with TV2
  // Then "Workers are scalable" with deduced TV
  
  const tv1 = { strength: 0.9, confidence: 0.85 };
  const tv2 = { strength: 0.85, confidence: 0.9 };
  
  const deduced = pln.deduction(tv1, tv2);
  console.log("\nDeduction:");
  console.log(`  Premise 1: Workers→Serverless (${tv1.strength}, ${tv1.confidence})`);
  console.log(`  Premise 2: Serverless→Scalable (${tv2.strength}, ${tv2.confidence})`);
  console.log(`  Conclusion: Workers→Scalable (${deduced.strength.toFixed(3)}, ${deduced.confidence.toFixed(3)})`);
  
  // Example: AND
  const andResult = pln.and(tv1, tv2);
  console.log("\nConjunction (AND):");
  console.log(`  A ∧ B = (${andResult.strength.toFixed(3)}, ${andResult.confidence.toFixed(3)})`);
  
  // Example: OR
  const orResult = pln.or(tv1, tv2);
  console.log("\nDisjunction (OR):");
  console.log(`  A ∨ B = (${orResult.strength.toFixed(3)}, ${orResult.confidence.toFixed(3)})`);
  
  // Example: NOT
  const notResult = pln.not(tv1);
  console.log("\nNegation (NOT):");
  console.log(`  ¬A = (${notResult.strength.toFixed(3)}, ${notResult.confidence.toFixed(3)})`);
}

/**
 * Example 6: Complete Integration
 * Full system integration with autonomous cognitive cycles
 */
export function example6_CompleteIntegration() {
  console.log("\n=== Example 6: Complete Integration ===");
  
  const cogprime = getCogPrime({
    maxAtoms: 100000,
    enableECAN: true,
    enablePLN: true,
    focusSize: 50,
    cycleInterval: 1000,
  });
  
  // Start autonomous cognitive cycles
  cogprime.startCognitiveCycles();
  console.log("Started autonomous cognitive cycles");
  
  // Build some content
  const buildOps = cogprime.getBuildOperations();
  buildOps.startBuild();
  buildOps.loadContent(["page1.mdx", "page2.mdx", "page3.mdx"]);
  buildOps.completeBuild(true);
  
  // Handle some requests
  const workerOps = cogprime.getWorkerOperations();
  workerOps.initializeWorker("");
  
  for (let i = 0; i < 5; i++) {
    workerOps.handleRequest({
      method: "GET",
      url: `https://example.com/page${i}`,
      path: `/page${i}`,
      headers: {},
    });
  }
  
  // Get comprehensive statistics
  const stats = cogprime.getSystemStatistics();
  
  console.log("\nSystem Statistics:");
  console.log("AtomSpace:");
  console.log(`  Total atoms: ${stats.atomSpace.totalAtoms}`);
  console.log(`  Nodes: ${stats.atomSpace.nodeCount}`);
  console.log(`  Links: ${stats.atomSpace.linkCount}`);
  console.log(`  Cognitive cycles: ${stats.atomSpace.cycles}`);
  
  if (stats.ecan) {
    console.log("\nECAN:");
    console.log(`  Focus size: ${stats.ecan.atomSpaceStats.averageSTI.toFixed(2)} avg STI`);
    console.log(`  Max STI: ${stats.ecan.atomSpaceStats.maxSTI.toFixed(2)}`);
  }
  
  console.log("\nWorker Operations:");
  console.log(`  Requests handled: ${stats.workerOps.worker.requestCount}`);
  console.log(`  Cache size: ${stats.workerOps.worker.cacheSize}`);
  
  // Stop cognitive cycles
  setTimeout(() => {
    cogprime.stopCognitiveCycles();
    console.log("\nStopped cognitive cycles");
  }, 3000);
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log("========================================");
  console.log("OpenCog Integration Examples");
  console.log("========================================");
  
  try {
    example1_BasicKnowledgeGraph();
    example2_CognitiveBuildProcess();
    example3_CognitiveWorkerOps();
    example4_AttentionDynamics();
    example5_PLNReasoning();
    example6_CompleteIntegration();
  } catch (error) {
    console.error("Error running examples:", error);
  }
}

// Uncomment to run examples:
// runAllExamples();
