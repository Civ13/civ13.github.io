---
layout: default
title: "Validation and reproduction"
permalink: /architecture/validation/
description: "Source-pinned Civ13 architecture, UML diagrams, evidence boundaries and downloadable audit artifacts."
image:
  path: /public/img/architecture-overview.png
  width: 1922
  height: 573
  alt: Civ13 architecture component overview
---

[Atlas home]({{ '/architecture/' | relative_url }}) · [Diagrams]({{ '/architecture/diagrams/' | relative_url }}) · [Audit]({{ '/architecture/audit/' | relative_url }}) · [Runtime]({{ '/architecture/runtime/' | relative_url }}) · [Persistence & services]({{ '/architecture/persistence/' | relative_url }})

# Validation and reproducibility

Source pin: 5bf351248de6050876fe5b53f91209a970cc5668. Audit date: 2026-10-20.

## Executed successfully

- Fresh master checkout pinned to the revision above; final git status is clean.
- Python lexical inventory over all 1,462 tracked DM files; include closure and SHA-256 accounting generated without executing repository code.
- Inventory checks: unique file paths, every discovered literal include exists, four declaration anchors, three call anchors and two excluded-feature anchors. See inventory/check-results.txt.
- Python AST parsing of tracked Python support files: zero parse failures, 2,036 function/class declarations inventoried. This does not validate imports or behavior.
- Runtime audit extraction: 93 research registrations, 99 prerequisite edges; no duplicate or unresolved prerequisite IDs. Process catalogue intentionally covers 37 directly included setup declarations, not every possible process instance.
- 215 commit-pinned report source links checked for existing files and valid line ranges; zero errors.
- PlantUML 1.2025.10 with local OpenJDK rendered 18 UML diagrams to SVG and PNG. Graphviz rendered two separately labeled graph views. All 20 SVG files parsed as XML with no renderer syntax-error output.
- Reviewed all 18 PNG render layouts in a contact sheet and representative component, sequence and state diagrams at full size. No missing render or visibly clipped diagram was observed.
- ReportLab generated the 19-page PDF atlas; pdfinfo confirms 19 pages, no embedded JavaScript. Each diagram retains a diagram-sized page to avoid shrinking labels onto fixed paper dimensions.

## Not claimed

No BYOND compiler, DreamChecker, DreamDaemon, live server, connected client, save round trip, gameplay assertion, performance benchmark, deployed bridge or external model was run. No exact compiler CFG, complete virtual dispatch solution, runtime path coverage, security certification or exhaustive behavioral verification is claimed.

The initial local Mermaid/Chromium rendering route could not start in the available sandbox. It was not used to claim successful rendering. Equivalent PlantUML sources were rendered locally instead; Mermaid sources remain editable alternatives. Font-cache warnings did not prevent successful PlantUML/Graphviz output.

## Render commands

Use an official PlantUML 1.2025.10 jar, Java and Graphviz:

    java -Djava.awt.headless=true -jar plantuml.jar -tsvg 'OUTPUT_ROOT/**/*.puml'
    java -Djava.awt.headless=true -jar plantuml.jar -tpng 'OUTPUT_ROOT/**/*.puml'
    dot -Tsvg INPUT.dot -o OUTPUT.svg
    python tools/build_atlas.py OUTPUT_ROOT

Inventory and report link checks:

    python tools/build_inventory.py SOURCE_ROOT OUTPUT_ROOT/inventory
    python tools/summarize_inventory.py SOURCE_ROOT OUTPUT_ROOT
    python tools/check_inventory.py OUTPUT_ROOT/inventory
    python tools/validate_artifacts.py SOURCE_ROOT OUTPUT_ROOT

Runtime-specific extractor:

    python runtime/build_runtime_artifacts.py --source SOURCE_ROOT --output OUTPUT_ROOT/runtime

The scripts operate on source/artifacts only. Dependencies for PDF packaging are Pillow and ReportLab; core inventory uses Python standard library. No paid services or cloud rendering endpoints are needed.


[Atlas home]({{ '/architecture/' | relative_url }}) · [Diagrams]({{ '/architecture/diagrams/' | relative_url }}) · [Audit]({{ '/architecture/audit/' | relative_url }}) · [Runtime]({{ '/architecture/runtime/' | relative_url }}) · [Persistence & services]({{ '/architecture/persistence/' | relative_url }})
