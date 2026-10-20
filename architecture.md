---
layout: page
title: "UML Atlas"
permalink: /architecture/
description: "Explore Civ13 architecture with 18 UML diagrams, source-linked reports and downloadable evidence."
image:
  path: /public/img/architecture-overview.png
  width: 1922
  height: 573
  alt: Civ13 architecture component overview
---

<p><strong>Source snapshot · 20 October 2026</strong></p>

Explore the game's architecture through readable UML views, source-linked reports and a reproducible inventory. This atlas describes [Civ13/Civ13 at 5bf351248de6](https://github.com/Civ13/Civ13/tree/5bf351248de6050876fe5b53f91209a970cc5668), not the state of a deployed server or unmerged changes.

<div class="message" role="note">
<strong>Coverage boundary:</strong> these are selected static architecture paths, not an exhaustive enumeration of all possible runtime paths. Dynamic dispatch, callbacks, external input and unbounded loops remain explicit limitations. No gameplay runtime or live server was tested for this audit.
</div>

[Read the audit]({{ '/architecture/audit/' | relative_url }}) · [Browse the diagrams]({{ '/architecture/diagrams/' | relative_url }}) · [Validation and limits]({{ '/architecture/validation/' | relative_url }})

<a href="{{ '/public/architecture/2026-10-20/diagrams/01-system-components.svg' | relative_url }}"><img src="{{ '/public/architecture/2026-10-20/diagrams/01-system-components.png' | relative_url }}" alt="Component overview: BYOND client, runtime scheduler, gameplay, lighting, persistence and external services" width="1922" height="573"></a>

Open the overview image for a full-size, zoomable SVG.

## Downloads

- [UML atlas PDF · 19 pages · 1.4 MB]({{ '/public/architecture/2026-10-20/Civ13-architecture-UML-atlas.pdf' | relative_url }})
- [Complete evidence bundle · ZIP · 11.2 MB]({{ '/public/architecture/2026-10-20/Civ13-architecture-audit-evidence.zip' | relative_url }})

The bundle contains editable PlantUML/Mermaid sources, rendered diagrams, reports, machine-readable inventories and reproduction tools. Large call-site tables are downloadable rather than rendered into this page.

## Explore by subject

- [Runtime and gameplay]({{ '/architecture/runtime/' | relative_url }}): startup, scheduler ownership, rounds, movement, combat, crafting, research and AI.
- [Persistence and services]({{ '/architecture/persistence/' | relative_url }}): save/load ownership, restart recovery, Help, file spools and external boundaries.
- [Diagram gallery]({{ '/architecture/diagrams/' | relative_url }}): 18 UML views plus two explicitly labeled dependency/call-candidate graphs.
- [Source-group coverage]({{ '/architecture/coverage/' | relative_url }}): 46 source groups and their inventory counts.

## What was inventoried?

- **1,462** tracked DM files.
- **1,257** files in the root environment's textual include closure, totaling **383,278** lines.
- **93** registered research nodes and **99** prerequisite edges.
- **215** source links checked for existing files and valid line ranges.

These are file and lexical inventory counts, not compiler-certified symbol totals or runtime coverage percentages. Included, activated and deployed are different claims.

## Main review targets

1. Different restart paths use different recovery contracts.
2. Scheduler comments and included controller infrastructure do not always establish actual ownership or activation.
3. Custom persistence couples domain state, transient-field exclusions and derived-state reconstruction.
4. Click, Topic, UI, callbacks and service spools have distinct entry-point and authority boundaries.

These are architectural review concerns, not asserted runtime defects or a security certification. See the [full audit]({{ '/architecture/audit/' | relative_url }}) for evidence and recommended next steps.
