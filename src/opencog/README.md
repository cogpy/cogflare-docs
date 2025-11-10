# OpenCog Extensions for Cloudflare Documentation Platform

This directory contains the OpenCog cognitive architecture integration for the Cloudflare documentation platform, implementing the formal specifications from `formal-specs/` as cognitive processes.

## Overview

The OpenCog extensions provide deep integration with the CogPrime cognitive architecture, enabling the documentation platform to use:

- **AtomSpace**: Hypergraph knowledge representation for documentation structure
- **ECAN**: Economic Attention Networks for cognitive resource allocation
- **PLN**: Probabilistic Logic Networks for uncertain reasoning
- **Cognitive Operations**: Build and worker operations implemented as cognitive processes

## Architecture

### Core Components

```
src/opencog/
├── atomspace/          # Knowledge representation
│   ├── atom.ts        # Atom types, truth values, attention values
│   └── atomspace.ts   # Hypergraph knowledge base
├── ecan/              # Attention allocation
│   └── attention.ts   # ECAN manager, importance spreading
├── pln/               # Reasoning
│   └── reasoner.ts    # PLN rules, pattern matching, query engine
├── operations/        # Cognitive operations
│   ├── build-operations.ts    # Build process as cognitive process
│   └── worker-operations.ts   # Request handling with attention
└── index.ts           # Main integration layer
```

### Integration with Formal Specifications

The implementation directly corresponds to the formal specifications:

| Formal Spec | OpenCog Implementation |
|-------------|----------------------|
| `operations.zpp` Part 1 | `operations/build-operations.ts` |
| `operations.zpp` Part 2 | `operations/worker-operations.ts` |
| `data_model.zpp` | AtomSpace nodes and links |
| `system_state.zpp` | Cognitive state representation |

## Key Concepts

### AtomSpace - Glocal Memory

The AtomSpace provides "glocal" memory - neither purely localized nor purely global:

- **Nodes**: Represent entities (doc pages, products, concepts)
- **Links**: Represent relationships (references, navigation, inheritance)
- **Truth Values**: Uncertain logic (strength, confidence)
- **Attention Values**: Resource allocation (STI, LTI, VLTI)

```typescript
import { AtomSpace, AtomType } from "./opencog";

const atomSpace = new AtomSpace();

// Add a documentation page
const pageNode = atomSpace.addNode(
  AtomType.DOC_PAGE_NODE,
  "workers-getting-started",
);

// Add product relationship
const productNode = atomSpace.addNode(
  AtomType.PRODUCT_NODE,
  "workers",
);

const link = atomSpace.addLink(
  AtomType.HAS_PRODUCT_LINK,
  [pageNode, productNode],
);
```

### ECAN - Attention Dynamics

ECAN manages cognitive resources through attention:

- **STI (Short-Term Importance)**: Current relevance (decays over time)
- **LTI (Long-Term Importance)**: Persistent relevance
- **VLTI (Very Long-Term Importance)**: Stable core knowledge
- **Attentional Focus**: Top N atoms by STI (actively processed)
- **Importance Spreading**: Attention diffuses along links

```typescript
import { ECANManager } from "./opencog";

const ecan = new ECANManager(atomSpace);

// Stimulate attention for a page
ecan.stimulate(pageNode, 100);

// Execute cognitive cycle
const stats = ecan.executeCycle();
// - Decays attention values
// - Spreads importance
// - Forgets low-importance atoms

// Get attentional focus
const focus = ecan.getAttentionalFocus();
```

### PLN - Probabilistic Reasoning

PLN enables reasoning under uncertainty:

- **Deduction**: A→B ∧ B→C ⇒ A→C
- **Induction**: A→B ⇒ B→A (weaker)
- **Abduction**: A→B ∧ B ⇒ A (backward reasoning)
- **Similarity**: Compute similarity between concepts
- **Pattern Matching**: Find matching patterns in knowledge

```typescript
import { PLNReasoner } from "./opencog";

const pln = new PLNReasoner();

// Deduce: If A→B with TV1 and B→C with TV2, then A→C
const tvAB = { strength: 0.9, confidence: 0.8 };
const tvBC = { strength: 0.85, confidence: 0.75 };
const tvAC = pln.deduction(tvAB, tvBC);
// Result: { strength: 0.765, confidence: 0.675 }
```

## Usage

### Basic Usage

```typescript
import { CogPrime, getCogPrime } from "./opencog";

// Get global instance
const cogprime = getCogPrime({
  maxAtoms: 100000,
  enableECAN: true,
  enablePLN: true,
  focusSize: 100,
});

// Start autonomous cognitive cycles
cogprime.startCognitiveCycles();

// Access build operations
const buildOps = cogprime.getBuildOperations();
buildOps.startBuild();
const pages = buildOps.loadContent(["path/to/page1.mdx"]);
buildOps.completeBuild(true);

// Access worker operations
const workerOps = cogprime.getWorkerOperations();
workerOps.initializeWorker(redirectsContent);
const response = workerOps.handleRequest(request);

// Get system statistics
const stats = cogprime.getSystemStatistics();
console.log("Total atoms:", stats.atomSpace.totalAtoms);
console.log("Focus size:", stats.ecan?.focusSize);

// Shutdown
cogprime.shutdown();
```

### Build Operations

Build operations implement the formal specification operations as cognitive processes:

```typescript
const buildOps = cogprime.getBuildOperations();

// 1. Start build (formal spec: StartBuild)
buildOps.startBuild();

// 2. Load content (formal spec: LoadContent)
const pages = buildOps.loadContent([
  "src/content/docs/workers/get-started.mdx",
  "src/content/docs/workers/configuration.mdx",
]);

// 3. Validate schema (formal spec: ValidateSchema)
for (const page of pages) {
  const { valid, validationErrors } = buildOps.validateSchema(page);
  if (!valid) {
    console.error("Validation errors:", validationErrors);
  }
}

// 4. Process markdown (formal spec: ProcessMarkdown)
const html = buildOps.processMarkdown(page.content, page.filePath);

// 5. Generate assets (formal spec: GenerateStaticAssets)
const assets = buildOps.generateStaticAssets(pages);

// 6. Complete build (formal spec: CompleteBuild)
buildOps.completeBuild(true);
```

### Worker Operations

Worker operations handle HTTP requests with cognitive attention:

```typescript
const workerOps = cogprime.getWorkerOperations();

// Initialize with redirects
workerOps.initializeWorker(`
/old-path /new-path 301
/another-old /another-new 302
`);

// Handle requests
const request = {
  method: "GET",
  url: "https://example.com/workers/get-started",
  path: "/workers/get-started",
  headers: {},
};

const response = workerOps.handleRequest(request);
// - Checks cache (formal spec: CheckCache)
// - Routes based on path (formal spec: HandleRequest)
// - Evaluates redirects (formal spec: EvaluateRedirects)
// - Caches response (formal spec: UpdateCache)

// Search content
const results = workerOps.searchContent("workers deployment");
```

## Cognitive Synergy

The power of this integration comes from **cognitive synergy** - the interaction of multiple cognitive processes:

1. **Perception → Attention**: Incoming requests stimulate attention
2. **Attention → Memory**: High-attention atoms stay in focus
3. **Memory → Reasoning**: Knowledge enables inference
4. **Reasoning → Action**: Inferences guide responses
5. **Action → Learning**: Outcomes update attention/truth values

Example synergy:

```typescript
// Perception: New request comes in
const request = { path: "/workers/get-started", ... };

// Attention: Request node gets high STI
const requestNode = atomSpace.addNode(AtomType.CONCEPT_NODE, request.path);
ecan.stimulate(requestNode, 50);

// Memory: Related pages retrieved through links
const relatedPages = atomSpace.getIncoming(requestNode);

// Reasoning: PLN infers similar content
const similar = queryEngine.query({
  type: "similarity",
  premises: [requestNode],
});

// Action: Generate enhanced response
const response = workerOps.handleRequest(request);

// Learning: Update attention based on success
if (response.statusCode === 200) {
  ecan.stimulate(requestNode, 10); // Reinforce successful path
}
```

## Benefits

### For Documentation Platform

1. **Intelligent Caching**: High-attention pages cached longer
2. **Smart Redirects**: Frequently used redirects get priority
3. **Content Discovery**: PLN finds related documentation
4. **Resource Management**: ECAN optimizes memory usage
5. **Pattern Recognition**: Learn from usage patterns

### For Cognitive Architecture Research

1. **Real-world AGI Application**: Documentation as cognitive domain
2. **Scalability Testing**: 5000+ pages in AtomSpace
3. **Hybrid Architecture**: Static generation + cognitive runtime
4. **Integration Patterns**: Formal specs → cognitive implementation

## Performance Considerations

- **AtomSpace Size**: Configured for 100K atoms (sufficient for large doc sites)
- **Cognitive Cycles**: Run every 1 second (configurable)
- **Attention Decay**: 1% per cycle (prevents unbounded growth)
- **Cache Integration**: Works with existing cache mechanisms
- **Memory Efficient**: Low-attention atoms automatically forgotten

## Future Enhancements

- **Learning from Analytics**: User behavior → attention values
- **Predictive Prefetching**: Anticipate next page requests
- **Semantic Search**: PLN-powered content discovery
- **Auto-categorization**: Learn doc structure from usage
- **Collaborative Filtering**: Similar user patterns → recommendations

## References

### CogPrime Architecture
- Multiple memory types (declarative, procedural, episodic, sensory, intentional, attentional)
- Cognitive synergy through component integration
- Glocal memory (balanced local/global processing)
- Emergent hierarchical and heterarchical networks

### OpenCog Framework
- AtomSpace hypergraph knowledge representation
- ECAN economic attention networks
- PLN probabilistic logic networks
- Pattern matching and unification

### Formal Specifications
- `formal-specs/operations.zpp` - Operation specifications
- `formal-specs/data_model.zpp` - Data model
- `formal-specs/system_state.zpp` - System state
- `formal-specs/README.md` - Z++ notation guide

## License

Same as main repository (MIT for code, CC BY 4.0 for documentation).
