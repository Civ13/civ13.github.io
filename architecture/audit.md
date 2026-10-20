---
layout: default
title: "Architecture audit"
permalink: /architecture/audit/
description: "Source-pinned Civ13 architecture, UML diagrams, evidence boundaries and downloadable audit artifacts."
image:
  path: /public/img/architecture-overview.png
  width: 1922
  height: 573
  alt: Civ13 architecture component overview
---

[Atlas home]({{ '/architecture/' | relative_url }}) · [Diagrams]({{ '/architecture/diagrams/' | relative_url }}) · [Audit]({{ '/architecture/audit/' | relative_url }}) · [Runtime]({{ '/architecture/runtime/' | relative_url }}) · [Persistence & services]({{ '/architecture/persistence/' | relative_url }})

# Civ13 architecture audit and UML atlas

Audit date: 2026-10-20. Source: [Civ13/Civ13 master at 5bf351248de6050876fe5b53f91209a970cc5668](https://github.com/Civ13/Civ13/tree/5bf351248de6050876fe5b53f91209a970cc5668). This is an immutable source snapshot, not a report of the deployed server or unmerged pull requests.

## Executive result

Civ13 is a BYOND/DM game with a large subtype/content tree, global registries and singleton controllers, a legacy process scheduler, independent yielded/deferred activities, map-specific round policy, and custom durable persistence. Its architecture cannot be understood as one linear main loop. Native BYOND events, virtual proc overrides, hook enumeration, queued callbacks, browser Topic messages, file spools and world reloads all add entry points.

The atlas covers the entire tracked DM file inventory and the literal include closure of civ13.dme. It provides focused UML views of the important lifecycle and subsystem interactions, plus searchable source-linked declarations, inheritance candidates, call sites, control sites and unresolved/dynamic sites. It does **not** claim that all possible executable runtime paths have been enumerated. Loops, recursion, dynamic dispatch, mutable types/data, timing and external input make that set unbounded; a lexical scan cannot prove path feasibility or reachability.

### Findings that matter

1. **Scheduler ownership needs an executable source of truth.** Legacy /process scheduling coexists with included MC/timer infrastructure and independent movement/spawn loops. Comments suggesting subsystem ownership do not establish active routing. Keep lifecycle diagrams tied to actual startup and registration, not only file names. See [runtime audit]({{ '/architecture/runtime/' | relative_url }}).
2. **Restart contracts differ.** Owned transactional restart recovery and scheduled maintenance save/reboot do not have the same completion/intent contract. This is a design consistency review target, not a demonstrated data-loss defect. See [persistence audit]({{ '/architecture/persistence/' | relative_url }}).
3. **Persistence crosses nearly every domain.** A custom variable serializer, explicit runtime-field exclusions, durable graph schemas and identity restoration must evolve together. A new transient pointer/clock or cross-level relationship can invalidate save assumptions. Treat schema/ownership review as a feature gate, not an optional follow-up.
4. **Entry-point and authority boundaries are distributed.** Click, native client/world callbacks, NanoUI, direct Topic handlers, admin verbs, Discord spools and Help worker exchanges have different gates. The presence of one UI or client gate does not prove that every alternate entry route is protected. No security vulnerability is asserted by this architecture audit.
5. **Derived state has distinct reconstruction phases.** Lighting corners/overlays, processing registries, runtime reservations and restored-round daylight are not interchangeable with ordinary saved gameplay state. Startup and restoration should have separately testable invariants.
6. **Names and comments can overstate behavior.** The preferencesSQLite directory uses delimiter-file storage on the audited path. Research comments describe optional prototype shortcuts while executable research completion requires the prototype gate. Distinguish documentation debt from proven functional bugs.
7. **Included, activated and deployed are different claims.** Experimental gameplay bridge and immutable_capture sources are outside the main include closure. Human sub-tile movement is included but defaults disabled. Bot-service deployment is separately blocked by repository guidance. This audit changes none of those states.

## Coverage and evidence strength

| Scope | Result |
|---|---:|
| Tracked DM files inventoried | 1,462 |
| Tracked DM source lines | 415,124 |
| DM files in textual include closure | 1,257 |
| Source lines in that closure | 383,278 |
| Included proc declaration candidates | 14,081 |
| Included type declaration/reopening candidates | 13,131 |
| Tracked support files inventoried (selected source/map/UI/workflow extensions) | 660 |
| Python AST function/class declarations | 2,036 |
| Python parse errors | 0 |

These are inventory counts, not compiler-certified symbol totals or a percentage of runtime behavior tested. Included types can be reopened; proc declarations can be conditionally compiled or macro-generated. Explicit parent_type overrides are recorded separately from path-default ancestry. All tracked DM files are scanned, including excluded tests and experimental sources; use in_include_union to filter production candidates.

The include closure is a **conditional union**: literal includes are followed without evaluating preprocessor conditions. No claim is made that every union member executes, or even that every union member is compiled in every configuration. The default map include is maps/nomads/nomads.dmm; other map content and runtime configuration can change reachability. Source path and SHA-256 are recorded per file.

### Evidence levels

- **File accounting:** complete for Git-tracked .dm files at the pin; repeatable hashing and literal include reachability.
- **Lexical inventory:** conservative source navigation aids, not a DM compiler AST. Proc/type recognition uses path and indentation heuristics. Macro expansion, braces/multiline edge cases and quoted interpolation can escape symbol recognition.
- **Call candidates:** call-sites.csv records spellings and receivers; call-target-name-index.json lists same-name declaration candidates. Joining them is not proof of an edge. Native builtins, macros, inherited dispatch and dynamic receivers remain unresolved.
- **Control sites:** conditions, loops, yields and returns are indexed. lexical-order-edges.csv contains consecutive source-statement navigation edges only. It is deliberately **not** labeled an executable CFG.
- **Manual diagrams:** selected source-traced architecture abstractions with direct supporting links in reports. They omit incidental branches for readability; their notes identify the abstraction boundary.
- **Runtime evidence:** none newly generated. No DreamDaemon, game client, live save/load, deployed service, external model or network bridge was exercised. No source edits, commits, PRs, feature activation or deployment occurred.

## Read the atlas

Start with the rendered overview and core type diagram in diagrams/. Then follow runtime/report.md for scheduler, startup, movement/combat, crafting/research and AI; persistence-services/report.md for save/load/restart and external services. Source diagrams are editable PlantUML (.puml) and Mermaid (.mmd). Graphviz (.dot) is used only for explicitly labeled lexical call-candidate views.

[Diagram index]({{ '/architecture/diagrams/' | relative_url }}) lists the rendered outputs and source files. SVG is zoomable; PNG is convenient for previews. The PDF atlas collects the rendered diagrams with captions.

### Additional source-traced boundaries

- [atom.Click and mob.ClickOn](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/_onclick/click.dm#L7): native entry forwards through usr, then target/click-clock/modifier gates and type-specific behavior. Numerous subtype overrides and early exits prevent a single universal attack path. The input sequence is a conceptual dispatch skeleton, not a statement-order proof.
- [client.Topic](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/client/client_procs.dm#L23): current usr/mob guard precedes routing. Direct handlers still own their own authorization and validation.
- [NanoUI Topic](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/nano/_nanoui.dm#L494): updates status, requires interactive status and matching user, calls src_object.Topic and then updates associated UIs. [Topic-state policies](https://github.com/Civ13/Civ13/tree/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/nano/interaction) encode different physical/admin/inventory/remote contexts.
- [Lighting construction](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/lighting/lighting_system.dm#L99): first constructs shared corners with deferred activity, then ordinary and compatibility overlays, activates fresh/existing corners, and releases readiness flags. Exceptions clear readiness and rethrow. Restored rounds use [apply_restored_lighting](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/lighting/lighting_system.dm#L138), not an assumption that fresh-round setup ran.
- [Dynamic hooks](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/hooks.dm#L50): text2path + typesof + call builds runtime dispatch from a hook name. A name-only call graph cannot recover all these edges without language/type information.

## Machine-readable inventory

- files.csv: all tracked DM files, include-union membership, line/byte counts, SHA-256, source permalink.
- includes.csv: literal include edges, location and existence checks.
- declarations.csv: proc and type declaration candidates, reopenings and exact source anchors.
- inheritance.csv: path-default ancestry candidates plus explicit parent_type overrides. Resolve overrides before using as a final type tree.
- call-sites.csv and call-target-name-index.json: call spellings, receiver text, source-proc association and possible same-name declarations.
- control-sites.csv: indexed control/yield statements.
- statements.csv and lexical-order-edges.csv: source-order navigation within recognized procs, not executable flow.
- dynamic-unresolved.csv: construction, reflection, hooks/callbacks, spawn/sleep, macro and opaque interpolation markers. A marker can be duplicated for different reasons; totals are sites/markers, not unique defects.
- preprocessor.csv: directives requiring a real preprocessing pass for exact compilation configuration.
- subsystem-coverage.csv: 46 source groups and their inventory counts.
- support-files.csv: selected non-DM source/UI/map/workflow inventory; Python AST declarations and imports are separate tables. This is not an AST/control-flow audit of every JavaScript, shell, PowerShell or map file.
- coverage.json: machine-readable pin, totals and limitations; check-results.txt: executed accounting/anchor checks.

## Recommended next engineering steps

1. Adopt the inventory as a baseline, then obtain a compiler-backed, configuration-specific DM symbol/type graph. Add explicit engine entry-point roots, parent_type resolution, macro expansion and virtual dispatch sets; do not relabel lexical edges as precise calls.
2. Make an entry-point matrix for native callbacks, verbs, Topic handlers, timers, hooks and file spools, with authority/lifetime requirements and tests per route.
3. Document one scheduler ownership model and verify each active worker's startup, cancellation, budget and teardown paths. Remove misleading subsystem comments only after behavior is confirmed.
4. Review restart/save contracts together, then add cross-path tests of completed-generation selection and failure holds before consolidating code.
5. Require explicit persistence decisions for new fields and schema changes, including restored references, transient clocks, resource ownership and derived registries.
6. For each high-risk sequence, add bounded integration/mutation tests plus real-client checks where rendering, movement timing or dispatch depends on a connected client. Existing fixture success is not blanket server acceptance.

No broad refactor is recommended solely on this static audit. First improve contracts and evidence at the boundaries above, then use narrowly scoped changes with regression coverage.

## Reproduce

Use a clean checkout of the exact pin. Run tools/build_inventory.py with the checkout and inventory output directory, then tools/summarize_inventory.py and tools/check_inventory.py. The scripts use Python standard library and do not execute repository code.

Example: python tools/build_inventory.py SOURCE_ROOT OUTPUT_ROOT/inventory

To explore a proc name: python tools/query_graph.py inventory create_lighting output.dot 45, then dot -Tsvg output.dot -o output.svg. The graph explicitly labels candidate edges and reports truncation. The default node cap is 80; changing it does not improve semantic precision.

Diagram render versions and verification results are recorded in VALIDATION.md. Read source reports for the evidence behind each manually drawn interaction. All repository source remains unmodified.


[Atlas home]({{ '/architecture/' | relative_url }}) · [Diagrams]({{ '/architecture/diagrams/' | relative_url }}) · [Audit]({{ '/architecture/audit/' | relative_url }}) · [Runtime]({{ '/architecture/runtime/' | relative_url }}) · [Persistence & services]({{ '/architecture/persistence/' | relative_url }})
