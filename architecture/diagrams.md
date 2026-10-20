---
layout: default
title: "Architecture diagrams"
permalink: /architecture/diagrams/
description: "Source-pinned Civ13 architecture, UML diagrams, evidence boundaries and downloadable audit artifacts."
image:
  path: /public/img/architecture-overview.png
  width: 1922
  height: 573
  alt: Civ13 architecture component overview
---

[Atlas home]({{ '/architecture/' | relative_url }}) · [Diagrams]({{ '/architecture/diagrams/' | relative_url }}) · [Audit]({{ '/architecture/audit/' | relative_url }}) · [Runtime]({{ '/architecture/runtime/' | relative_url }}) · [Persistence & services]({{ '/architecture/persistence/' | relative_url }})

# Architecture diagrams

Source pin: [`5bf351248de6050876fe5b53f91209a970cc5668`](https://github.com/Civ13/Civ13/tree/5bf351248de6050876fe5b53f91209a970cc5668). These are static abstractions, not exhaustive runtime execution paths. Select an image or SVG link to zoom; editable sources are alongside each view.

## System overview and boundaries

### System components

<a href="{{ '/public/architecture/2026-10-20/diagrams/01-system-components.svg' | relative_url }}"><img class="architecture-diagram" style="height: auto;" src="{{ '/public/architecture/2026-10-20/diagrams/01-system-components.png' | relative_url }}" loading="lazy" alt="System components; full details and source links in the accompanying report" width="1922" height="573"></a>

[SVG]({{ '/public/architecture/2026-10-20/diagrams/01-system-components.svg' | relative_url }}) · [PNG]({{ '/public/architecture/2026-10-20/diagrams/01-system-components.png' | relative_url }}) · [PUML]({{ '/public/architecture/2026-10-20/diagrams/01-system-components.puml' | relative_url }}) · [MMD]({{ '/public/architecture/2026-10-20/diagrams/01-system-components.mmd' | relative_url }})

### Core domain types

<a href="{{ '/public/architecture/2026-10-20/diagrams/02-domain-types.svg' | relative_url }}"><img class="architecture-diagram" style="height: auto;" src="{{ '/public/architecture/2026-10-20/diagrams/02-domain-types.png' | relative_url }}" loading="lazy" alt="Core domain types; full details and source links in the accompanying report" width="1798" height="672"></a>

[SVG]({{ '/public/architecture/2026-10-20/diagrams/02-domain-types.svg' | relative_url }}) · [PNG]({{ '/public/architecture/2026-10-20/diagrams/02-domain-types.png' | relative_url }}) · [PUML]({{ '/public/architecture/2026-10-20/diagrams/02-domain-types.puml' | relative_url }}) · [MMD]({{ '/public/architecture/2026-10-20/diagrams/02-domain-types.mmd' | relative_url }})

### Player input dispatch

<a href="{{ '/public/architecture/2026-10-20/diagrams/03-input-dispatch.svg' | relative_url }}"><img class="architecture-diagram" style="height: auto;" src="{{ '/public/architecture/2026-10-20/diagrams/03-input-dispatch.png' | relative_url }}" loading="lazy" alt="Player input dispatch; full details and source links in the accompanying report" width="1119" height="912"></a>

[SVG]({{ '/public/architecture/2026-10-20/diagrams/03-input-dispatch.svg' | relative_url }}) · [PNG]({{ '/public/architecture/2026-10-20/diagrams/03-input-dispatch.png' | relative_url }}) · [PUML]({{ '/public/architecture/2026-10-20/diagrams/03-input-dispatch.puml' | relative_url }}) · [MMD]({{ '/public/architecture/2026-10-20/diagrams/03-input-dispatch.mmd' | relative_url }})

### Lighting lifecycle

<a href="{{ '/public/architecture/2026-10-20/diagrams/04-lighting-lifecycle.svg' | relative_url }}"><img class="architecture-diagram" style="height: auto;" src="{{ '/public/architecture/2026-10-20/diagrams/04-lighting-lifecycle.png' | relative_url }}" loading="lazy" alt="Lighting lifecycle; full details and source links in the accompanying report" width="1050" height="1253"></a>

[SVG]({{ '/public/architecture/2026-10-20/diagrams/04-lighting-lifecycle.svg' | relative_url }}) · [PNG]({{ '/public/architecture/2026-10-20/diagrams/04-lighting-lifecycle.png' | relative_url }}) · [PUML]({{ '/public/architecture/2026-10-20/diagrams/04-lighting-lifecycle.puml' | relative_url }}) · [MMD]({{ '/public/architecture/2026-10-20/diagrams/04-lighting-lifecycle.mmd' | relative_url }})

### Lighting call-name candidates (not proven calls)

This larger graph is provided as a separate zoomable SVG to keep this page lightweight.

[SVG]({{ '/public/architecture/2026-10-20/diagrams/05-lighting-call-candidates.svg' | relative_url }}) · [DOT]({{ '/public/architecture/2026-10-20/diagrams/05-lighting-call-candidates.dot' | relative_url }})

### NanoUI interaction boundary

<a href="{{ '/public/architecture/2026-10-20/diagrams/06-nanoui-boundary.svg' | relative_url }}"><img class="architecture-diagram" style="height: auto;" src="{{ '/public/architecture/2026-10-20/diagrams/06-nanoui-boundary.png' | relative_url }}" loading="lazy" alt="NanoUI interaction boundary; full details and source links in the accompanying report" width="739" height="783"></a>

[SVG]({{ '/public/architecture/2026-10-20/diagrams/06-nanoui-boundary.svg' | relative_url }}) · [PNG]({{ '/public/architecture/2026-10-20/diagrams/06-nanoui-boundary.png' | relative_url }}) · [PUML]({{ '/public/architecture/2026-10-20/diagrams/06-nanoui-boundary.puml' | relative_url }})

## Runtime and gameplay

### Runtime ownership

<a href="{{ '/public/architecture/2026-10-20/runtime/01_runtime_components.svg' | relative_url }}"><img class="architecture-diagram" style="height: auto;" src="{{ '/public/architecture/2026-10-20/runtime/01_runtime_components.png' | relative_url }}" loading="lazy" alt="Runtime ownership; full details and source links in the accompanying report" width="1092" height="1336"></a>

[SVG]({{ '/public/architecture/2026-10-20/runtime/01_runtime_components.svg' | relative_url }}) · [PNG]({{ '/public/architecture/2026-10-20/runtime/01_runtime_components.png' | relative_url }}) · [PUML]({{ '/public/architecture/2026-10-20/runtime/01_runtime_components.puml' | relative_url }}) · [MMD]({{ '/public/architecture/2026-10-20/runtime/01_runtime_components.mmd' | relative_url }})

### Round lifecycle

<a href="{{ '/public/architecture/2026-10-20/runtime/02_round_lifecycle.svg' | relative_url }}"><img class="architecture-diagram" style="height: auto;" src="{{ '/public/architecture/2026-10-20/runtime/02_round_lifecycle.png' | relative_url }}" loading="lazy" alt="Round lifecycle; full details and source links in the accompanying report" width="1145" height="1141"></a>

[SVG]({{ '/public/architecture/2026-10-20/runtime/02_round_lifecycle.svg' | relative_url }}) · [PNG]({{ '/public/architecture/2026-10-20/runtime/02_round_lifecycle.png' | relative_url }}) · [PUML]({{ '/public/architecture/2026-10-20/runtime/02_round_lifecycle.puml' | relative_url }}) · [MMD]({{ '/public/architecture/2026-10-20/runtime/02_round_lifecycle.mmd' | relative_url }})

### Movement and collision ownership

<a href="{{ '/public/architecture/2026-10-20/runtime/03_movement_sequence.svg' | relative_url }}"><img class="architecture-diagram" style="height: auto;" src="{{ '/public/architecture/2026-10-20/runtime/03_movement_sequence.png' | relative_url }}" loading="lazy" alt="Movement and collision ownership; full details and source links in the accompanying report" width="1813" height="1210"></a>

[SVG]({{ '/public/architecture/2026-10-20/runtime/03_movement_sequence.svg' | relative_url }}) · [PNG]({{ '/public/architecture/2026-10-20/runtime/03_movement_sequence.png' | relative_url }}) · [PUML]({{ '/public/architecture/2026-10-20/runtime/03_movement_sequence.puml' | relative_url }}) · [MMD]({{ '/public/architecture/2026-10-20/runtime/03_movement_sequence.mmd' | relative_url }})

### Combat dispatch

<a href="{{ '/public/architecture/2026-10-20/runtime/04_combat_dispatch.svg' | relative_url }}"><img class="architecture-diagram" style="height: auto;" src="{{ '/public/architecture/2026-10-20/runtime/04_combat_dispatch.png' | relative_url }}" loading="lazy" alt="Combat dispatch; full details and source links in the accompanying report" width="861" height="1902"></a>

[SVG]({{ '/public/architecture/2026-10-20/runtime/04_combat_dispatch.svg' | relative_url }}) · [PNG]({{ '/public/architecture/2026-10-20/runtime/04_combat_dispatch.png' | relative_url }}) · [PUML]({{ '/public/architecture/2026-10-20/runtime/04_combat_dispatch.puml' | relative_url }}) · [MMD]({{ '/public/architecture/2026-10-20/runtime/04_combat_dispatch.mmd' | relative_url }})

### Crafting transaction

<a href="{{ '/public/architecture/2026-10-20/runtime/05_crafting_sequence.svg' | relative_url }}"><img class="architecture-diagram" style="height: auto;" src="{{ '/public/architecture/2026-10-20/runtime/05_crafting_sequence.png' | relative_url }}" loading="lazy" alt="Crafting transaction; full details and source links in the accompanying report" width="1546" height="1317"></a>

[SVG]({{ '/public/architecture/2026-10-20/runtime/05_crafting_sequence.svg' | relative_url }}) · [PNG]({{ '/public/architecture/2026-10-20/runtime/05_crafting_sequence.png' | relative_url }}) · [PUML]({{ '/public/architecture/2026-10-20/runtime/05_crafting_sequence.puml' | relative_url }}) · [MMD]({{ '/public/architecture/2026-10-20/runtime/05_crafting_sequence.mmd' | relative_url }})

### Research model

<a href="{{ '/public/architecture/2026-10-20/runtime/06_research_model.svg' | relative_url }}"><img class="architecture-diagram" style="height: auto;" src="{{ '/public/architecture/2026-10-20/runtime/06_research_model.png' | relative_url }}" loading="lazy" alt="Research model; full details and source links in the accompanying report" width="963" height="1190"></a>

[SVG]({{ '/public/architecture/2026-10-20/runtime/06_research_model.svg' | relative_url }}) · [PNG]({{ '/public/architecture/2026-10-20/runtime/06_research_model.png' | relative_url }}) · [PUML]({{ '/public/architecture/2026-10-20/runtime/06_research_model.puml' | relative_url }}) · [MMD]({{ '/public/architecture/2026-10-20/runtime/06_research_model.mmd' | relative_url }})

### Animal AI states

<a href="{{ '/public/architecture/2026-10-20/runtime/07_animal_ai.svg' | relative_url }}"><img class="architecture-diagram" style="height: auto;" src="{{ '/public/architecture/2026-10-20/runtime/07_animal_ai.png' | relative_url }}" loading="lazy" alt="Animal AI states; full details and source links in the accompanying report" width="1853" height="815"></a>

[SVG]({{ '/public/architecture/2026-10-20/runtime/07_animal_ai.svg' | relative_url }}) · [PNG]({{ '/public/architecture/2026-10-20/runtime/07_animal_ai.png' | relative_url }}) · [PUML]({{ '/public/architecture/2026-10-20/runtime/07_animal_ai.puml' | relative_url }}) · [MMD]({{ '/public/architecture/2026-10-20/runtime/07_animal_ai.mmd' | relative_url }})

### Research prerequisites (dependency graph)

This larger graph is provided as a separate zoomable SVG to keep this page lightweight.

[SVG]({{ '/public/architecture/2026-10-20/runtime/08_research_prerequisites.svg' | relative_url }}) · [MMD]({{ '/public/architecture/2026-10-20/runtime/08_research_prerequisites.mmd' | relative_url }}) · [DOT]({{ '/public/architecture/2026-10-20/runtime/08_research_prerequisites.dot' | relative_url }})

### Process lifecycle

<a href="{{ '/public/architecture/2026-10-20/runtime/09_process_state.svg' | relative_url }}"><img class="architecture-diagram" style="height: auto;" src="{{ '/public/architecture/2026-10-20/runtime/09_process_state.png' | relative_url }}" loading="lazy" alt="Process lifecycle; full details and source links in the accompanying report" width="1239" height="1166"></a>

[SVG]({{ '/public/architecture/2026-10-20/runtime/09_process_state.svg' | relative_url }}) · [PNG]({{ '/public/architecture/2026-10-20/runtime/09_process_state.png' | relative_url }}) · [PUML]({{ '/public/architecture/2026-10-20/runtime/09_process_state.puml' | relative_url }}) · [MMD]({{ '/public/architecture/2026-10-20/runtime/09_process_state.mmd' | relative_url }})

## Persistence and services

### Help service sequence

<a href="{{ '/public/architecture/2026-10-20/persistence-services/help-sequence.svg' | relative_url }}"><img class="architecture-diagram" style="height: auto;" src="{{ '/public/architecture/2026-10-20/persistence-services/help-sequence.png' | relative_url }}" loading="lazy" alt="Help service sequence; full details and source links in the accompanying report" width="1368" height="1060"></a>

[SVG]({{ '/public/architecture/2026-10-20/persistence-services/help-sequence.svg' | relative_url }}) · [PNG]({{ '/public/architecture/2026-10-20/persistence-services/help-sequence.png' | relative_url }}) · [PUML]({{ '/public/architecture/2026-10-20/persistence-services/help-sequence.puml' | relative_url }}) · [MMD]({{ '/public/architecture/2026-10-20/persistence-services/help-sequence.mmd' | relative_url }})

### Persistence components

<a href="{{ '/public/architecture/2026-10-20/persistence-services/persistence-components.svg' | relative_url }}"><img class="architecture-diagram" style="height: auto;" src="{{ '/public/architecture/2026-10-20/persistence-services/persistence-components.png' | relative_url }}" loading="lazy" alt="Persistence components; full details and source links in the accompanying report" width="1470" height="1091"></a>

[SVG]({{ '/public/architecture/2026-10-20/persistence-services/persistence-components.svg' | relative_url }}) · [PNG]({{ '/public/architecture/2026-10-20/persistence-services/persistence-components.png' | relative_url }}) · [PUML]({{ '/public/architecture/2026-10-20/persistence-services/persistence-components.puml' | relative_url }}) · [MMD]({{ '/public/architecture/2026-10-20/persistence-services/persistence-components.mmd' | relative_url }})

### Restart recovery

<a href="{{ '/public/architecture/2026-10-20/persistence-services/restart-state.svg' | relative_url }}"><img class="architecture-diagram" style="height: auto;" src="{{ '/public/architecture/2026-10-20/persistence-services/restart-state.png' | relative_url }}" loading="lazy" alt="Restart recovery; full details and source links in the accompanying report" width="1228" height="1254"></a>

[SVG]({{ '/public/architecture/2026-10-20/persistence-services/restart-state.svg' | relative_url }}) · [PNG]({{ '/public/architecture/2026-10-20/persistence-services/restart-state.png' | relative_url }}) · [PUML]({{ '/public/architecture/2026-10-20/persistence-services/restart-state.puml' | relative_url }}) · [MMD]({{ '/public/architecture/2026-10-20/persistence-services/restart-state.mmd' | relative_url }})

### Save and load sequence

<a href="{{ '/public/architecture/2026-10-20/persistence-services/save-load-sequence.svg' | relative_url }}"><img class="architecture-diagram" style="height: auto;" src="{{ '/public/architecture/2026-10-20/persistence-services/save-load-sequence.png' | relative_url }}" loading="lazy" alt="Save and load sequence; full details and source links in the accompanying report" width="1111" height="1382"></a>

[SVG]({{ '/public/architecture/2026-10-20/persistence-services/save-load-sequence.svg' | relative_url }}) · [PNG]({{ '/public/architecture/2026-10-20/persistence-services/save-load-sequence.png' | relative_url }}) · [PUML]({{ '/public/architecture/2026-10-20/persistence-services/save-load-sequence.puml' | relative_url }}) · [MMD]({{ '/public/architecture/2026-10-20/persistence-services/save-load-sequence.mmd' | relative_url }})

### External services

<a href="{{ '/public/architecture/2026-10-20/persistence-services/services-components.svg' | relative_url }}"><img class="architecture-diagram" style="height: auto;" src="{{ '/public/architecture/2026-10-20/persistence-services/services-components.png' | relative_url }}" loading="lazy" alt="External services; full details and source links in the accompanying report" width="2476" height="668"></a>

[SVG]({{ '/public/architecture/2026-10-20/persistence-services/services-components.svg' | relative_url }}) · [PNG]({{ '/public/architecture/2026-10-20/persistence-services/services-components.png' | relative_url }}) · [PUML]({{ '/public/architecture/2026-10-20/persistence-services/services-components.puml' | relative_url }}) · [MMD]({{ '/public/architecture/2026-10-20/persistence-services/services-components.mmd' | relative_url }})

[Atlas home]({{ '/architecture/' | relative_url }}) · [Diagrams]({{ '/architecture/diagrams/' | relative_url }}) · [Audit]({{ '/architecture/audit/' | relative_url }}) · [Runtime]({{ '/architecture/runtime/' | relative_url }}) · [Persistence & services]({{ '/architecture/persistence/' | relative_url }})
