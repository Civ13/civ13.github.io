---
layout: default
title: "Persistence and services"
permalink: /architecture/persistence/
description: "Source-pinned Civ13 architecture, UML diagrams, evidence boundaries and downloadable audit artifacts."
image:
  path: /public/img/architecture-overview.png
  width: 1922
  height: 573
  alt: Civ13 architecture component overview
---

[Atlas home]({{ '/architecture/' | relative_url }}) · [Diagrams]({{ '/architecture/diagrams/' | relative_url }}) · [Audit]({{ '/architecture/audit/' | relative_url }}) · [Runtime]({{ '/architecture/runtime/' | relative_url }}) · [Persistence & services]({{ '/architecture/persistence/' | relative_url }})

# Persistence and service architecture audit

Scope: static read-only audit of Civ13 master commit `5bf351248de6050876fe5b53f91209a970cc5668`. No compilation, native runtime, paid model request, service action, or deployment was performed. Diagrams describe selected architecture-level paths and explicit branch families, not an exhaustive dynamic execution proof. Files present in the repository do not establish deployment. Mermaid component-like flowcharts are not formal UML component syntax.

## Production boundary and ownership

The main DME includes persistence functions, restart transaction, lifecycle control, durable graph/contract/timer/environment/world code, player reclaim, loader, and saver. It also includes the Help service, Python control process, preferences, and webhook code. `immutable_capture.dm` is absent from the main DME and appears in isolated test includes; the private gameplay bridge explicitly states it is not included. Do not conflate optional/test source with live production paths.

Sources: [civ13.dme:1111-1124](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/civ13.dme#L1111-L1124); [civ13.dme:1215-1245](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/civ13.dme#L1215-L1245); [code/modules/gameplay_bridge/bridge.dm:1-4](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/gameplay_bridge/bridge.dm#L1-L4).

`map_storage` is the serialization coordinator. `ticker.savemap` and `ticker.loadmap` wrap the backend with admission, exception handling and cleanup. `begin_persistence_operation` creates a unique `persistence_world_operation`; an active identity, not merely a boolean busy flag, owns release. It rejects existing operations, failed-load/dimension holds, active z reservations and conflicting restart intent. Backend and content entry are each one-shot. Direct Save_World/Load_World calls acquire an operation too, but the ticker load wrapper additionally supplies the preflight/clear/metadata/reclaim lifecycle; direct backend calls must not be modeled as equivalent to full ticker restoration.

Sources: [code/modules/persistence/functions.dm:290-365](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/persistence/functions.dm#L290-L365); [code/modules/persistence/functions.dm:400-464](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/persistence/functions.dm#L400-L464).

## Save graph and completed generations

1. Admit the operation, prepare durable account ownership, capture supported durable world and round state, generate a round-v1/v2 identity.
2. If a completed generation exists, invalidate the old backup marker, copy the old generation files, and copy its completion marker last. Only then invalidate the active marker. This preserves a prior completed generation before replacement.
3. Write map metadata; for each z-level create a native savefile containing version, dimensions and generation. Traverse turfs and recursively selected objects/mobs; serialize changed fields, contents, and typed list/value envelopes. Explicit list identity preserves aliases/cycles.
4. Finalize the separate durable graph (when opted in), write round.json, then publish save_complete.txt last. A partial save without that marker is not an accepted recovery point.

The serializer excludes clients, map metadata objects, ignored types, should_save=false objects, spatial/session identity fields and `persistence_runtime_var` fields. This custom serializer visits tmp fields: tmp alone does not guarantee exclusion. `before_save_context` can participate through owned export frames and declared save transfers. A cross-z movable reference in a per-level object graph is rejected, not silently flattened. The separate durable metadata graph binds existing per-level entries without constructing a second leader/body.

Sources: [code/modules/persistence/saving.dm:9-181](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/persistence/saving.dm#L9-L181); [code/modules/persistence/functions.dm:14-76](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/persistence/functions.dm#L14-L76); [code/modules/persistence/durable_graph.dm:1-109](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/persistence/durable_graph.dm#L1-L109).

Durable metadata is opt-in by exact map profile, not universal world persistence. Schemas cover map/faction/research/economic state, environment, selected area/weather fields, timers, and bounded faction icon pixels. Timers and clock fields encode remainders/origins instead of copying a previous process clock. Capture rejects active seasonal/weather/lighting transitions. Extending map subtypes or adding state requires reviewing the schema and timer inventory, not merely adding a field.

Sources: [code/modules/persistence/durable_contract.dm:1-86](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/persistence/durable_contract.dm#L1-L86); [code/modules/persistence/durable_world.dm:1-45](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/persistence/durable_world.dm#L1-L45); [code/modules/persistence/durable_timers.dm:1-70](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/persistence/durable_timers.dm#L1-L70).

## Load, rebuild, and reconnect

`ticker.loadmap` owns admission across dimension preparation, full save validation, mutation, restoration, and player callbacks. Validation checks marker, matching map metadata, round identity, dimensions, full grids, valid types, entry references, duplicate player ownership, and durable graph/schema. Dimension growth has its own reservation/recovery gate; rejection can retain a hold to prevent overwrite.

After preflight, the wrapper snapshots the header, verifies an expected restart generation, requires durable world idle, marks mutation started, resets player restoration, suspends durable callbacks, and clears the map. The backend allocates every turf before loading references, indexes same-level turfs, loads recursive entries, invokes after_load, registers restored players, then rebuilds opacity and lighting. Metadata, durable world, and round phase/lighting are restored afterward. A post-mutation failure latches recovery; this is fail-closed restoration, not rollback of a partially mutated world.

Sources: [code/modules/persistence/functions.dm:420-464](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/persistence/functions.dm#L420-L464); [code/modules/persistence/functions.dm:684-754](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/persistence/functions.dm#L684-L754); [code/modules/persistence/loading.dm:183-354](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/persistence/loading.dm#L183-L354).

Durable player ownership is a normalized non-guest authenticated ckey, distinct from transient client/key fields. Preparation rejects ambiguous ownership; reconnect only claims one living, located, unoccupied restored human, checks playing/server bans, consumes the reservation, transfers the authenticated client's key through normal Login, and deletes the lobby. Restart recovery waits until its intent is consumed before reclaiming waiting clients. No Help conversation is restored with the body.

Sources: [code/modules/persistence/player_reclaim.dm:1-116](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/persistence/player_reclaim.dm#L1-L116); [code/modules/persistence/restart_transaction.dm:156-185](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/persistence/restart_transaction.dm#L156-L185).

## Restart state machine and deployment lifecycle

The validated restart transaction supports native BYOND durable metadata profiles (reported in source as Gaia/Europe) and explicitly rejects OpenDream. It saves and validates a completed generation, writes a one-shot restart_intent.json binding generation/metadata/round hashes, rereads it, revalidates ownership, then requests native restart or graceful world deletion. Startup detects the intent before normal setup, holds fresh-round/player paths, prepares dimensions, validates the same generation, imports once, consumes only the matching intent and then releases player restoration. Malformed/mismatched intent, failed dimension admission, incomplete import, or failed intent deletion retains a recovery hold. An import that already began and failed is not retried into the same mutated world.

There are two distinct persistence boot routes. PERSISTENCE configuration autoloads a matching completed ordinary save; an explicit restart intent applies independently of that gamemode. Scheduled maintenance is a separate save -> completion-marker check -> ordinary Reboot path, rather than `persistence_restart.execute`. This divergence is a review target, not a demonstrated defect: its recovery contract depends on ordinary PERSISTENCE autoload, whereas the transaction binds a specific generation.

Sources: [code/modules/persistence/restart_transaction.dm:77-185](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/persistence/restart_transaction.dm#L77-L185); [code/setup.dm:136-172](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/setup.dm#L136-L172); [code/world.dm:356-398](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/world.dm#L356-L398).

The compiled local lifecycle Topic endpoint requires IPv4 loopback, configured token/revision, exact allowed keys/actions and boot-session/operation binding. It exposes status, bounded diagnostics and save_shutdown, not arbitrary eval or shell. Operations have replay protection and a bounded operation count. The Python Nomads supervisor is explicitly restricted to port 1714 and NOMADS_EUROPE: fetch exact commit, detached build, generate catalog, switch that isolated checkout's map include, require clean compilation, hash binaries, ensure owned process/session identity, defer update with clients or busy save, request bound save/shutdown, snapshot validated files, launch a fresh run directory, and wait for matched restoration/readiness. Unexpected exit, mismatch or timeout preserves evidence rather than automatically starting a fresh round. These are source contracts, not proof that this supervisor is installed or running.

Sources: [code/modules/persistence/nomads_lifecycle.dm:70-108](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/persistence/nomads_lifecycle.dm#L70-L108); [scripts/nomads-lifecycle/supervisor.py:222-422](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/scripts/nomads-lifecycle/supervisor.py#L222-L422).

## External service and file boundaries

- Help: authenticated client verb -> service availability/rate-limit/queue admission -> bounded JSON request and ready marker -> separate Python bridge -> approved player corpus/recipe/wiki retrieval -> configured Ollama HTTP endpoint -> atomic bounded response -> DM id and client-generation checks -> escaped/bounded renderer. Account identity is salted before spooling; conversation history is client-session-only with generation and action tokens. There are eight queue slots; configured worker count is one or two. Bridge startup clears old spool requests instead of replaying them. HTTP uses a separate deadline-bounded child, disables environment proxies and redirects, and optional credentials come from an environment variable. The model has no tools/actions. File deletion is not encryption or guaranteed crash-time erasure.
- Discord: world messaging loop polls SQL/discord2ooc, discord2admin, discord2dm, discord2ban and discord2unban files, splits delimiter fields, dispatches chat/moderation and deletes consumed files. The local file writer and OS permissions are therefore a privileged integration boundary. This checkout does not contain the deployed bot implementation or establish who can write those files.
- Preferences: despite the preferencesSQLite folder and SQL path names, inspected code reads/writes delimiter-encoded SQL/charprefs.txt. Existing-account update deletes/rebuilds that file; there is no database transaction shown on this path. Do not label it SQLite storage based on the folder name.
- Webhooks: optional configured address/key gates outgoing asynchronously spawned world.Export calls with URL-encoded JSON. Login webhook fields can include ckey/IP/CID. Endpoint configuration, logging and access should be treated as privacy/security boundaries; no deployed endpoint was inspected.
- World Topic: rate-limited public status/ping dispatch uses registered world_topic subtypes, with lifecycle handled separately through the restricted endpoint. This is different from object Topic/UI dispatch.
- Script control: native `/process/python/execute` rate-limits invocation and delegates to shell Python scripts (sudo on Unix); OpenDream instead permits only fixed mapswap/restart spool actions. The process fire method is a no-op, so its registration does not imply autonomous command execution.

Sources: [code/game/mob/player_help.dm:24-218](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/game/mob/player_help.dm#L24-L218); [code/game/mob/player_help.dm:291-405](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/game/mob/player_help.dm#L291-L405); [scripts/player_help_bridge.py:303-359](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/scripts/player_help_bridge.py#L303-L359); [scripts/player_help_bridge.py:462-641](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/scripts/player_help_bridge.py#L462-L641); [code/world.dm:183-232](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/world.dm#L183-L232); [code/world.dm:400-471](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/world.dm#L400-L471); [code/modules/client/preferencesSQLite/preferences_saving&loading&del.dm:1-124](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/client/preferencesSQLite/preferences_saving%26loading%26del.dm#L1-L124); [code/modules/webhooks/webhooks.dm:31-49](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/webhooks/webhooks.dm#L31-L49); [code/processes/python.dm:1-58](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/processes/python.dm#L1-L58).

## Launch, CI, and optional tooling

Legacy launch.py and updateserver.py pull/reset a configured checkout, generate the crafting catalog, invoke DreamMaker, copy binaries/config and (launch only) start trusted DreamDaemon. These are not the transaction supervisor. Several shell steps use os.system without checked return values, unlike the checked catalog generation. Review this legacy deployment path before relying on failure containment; no failed deployment was reproduced.

The main CI workflow uses reusable change selection, an offline evidence-checker job and a build job with conditional compilation/native fixture lanes. BYOND is pinned to 516.1681. Documentation-only changes can skip game compilation; extensive/new-test selectors govern many native fixtures and negative controls. A source-defined CI step is not a passing run, and fixture success is not connected-client or deployed-server acceptance. Other repository workflows cover tooling, documentation and review automation; this report does not certify their external secrets or execution history.

Bot service control is default-off and its README explicitly says not to install/enable the draft unit yet: independent game supervision and bot-restart/game-survival acceptance are prerequisites. The helper's fixed service actions, nonblocking lock and cooldown are narrower than the legacy shell pathway. The gameplay bridge and immutable capture are separate non-production/test mechanisms at this commit, not live Help or live save replacements.

Sources: [scripts/travis_pre_byond.sh:1-32](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/scripts/travis_pre_byond.sh#L1-L32); [scripts/launch.py:1-53](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/scripts/launch.py#L1-L53); [scripts/updateserver.py:1-46](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/scripts/updateserver.py#L1-L46); [.github/workflows/test.yml:58-172](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/.github/workflows/test.yml#L58-L172); [scripts/bot-service/README.md:1-92](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/scripts/bot-service/README.md#L1-L92); [code/modules/gameplay_bridge/bridge.dm:1-4](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/code/modules/gameplay_bridge/bridge.dm#L1-L4); [tests/world_save/immutable_capture.dme:1-14](https://github.com/Civ13/Civ13/blob/5bf351248de6050876fe5b53f91209a970cc5668/tests/world_save/immutable_capture.dme#L1-L14).

## Architectural risks and next verification targets

1. **Yielding snapshot semantics:** completed generation integrity is stronger than atomic gameplay snapshot semantics. Tick checks and hooks yield. Audit every state-changing subsystem's save gate and verify invariants under interleaving; do not claim transactional world freeze.
2. **Schema/exclusion maintenance:** changed-vars traversal and explicit tmp exclusions create a continuing obligation for new fields, callbacks, timers, caches and cross-z references. Pair schema changes with disk roundtrip and legacy migration controls.
3. **Recovery availability:** fail-closed holds protect data from overwrite but require an operator recovery runbook. Preserve the original compiled map and matched complete files; distinguish preflight rejection from post-mutation failure.
4. **Two restart contracts:** consolidate or explicitly document scheduled-maintenance ordinary autoload versus generation-bound transactional restart. Test both, including interrupted writes and intent consumption failures.
5. **File IPC privilege and durability:** Discord moderation, preference rewrites, Help and supervisor files have different formats and trust assumptions. Review ownership/permissions, concurrent writers, restart cleanup, partial writes and retention separately; one spool's safeguards do not automatically cover another.
6. **Legacy deployment versus owned supervisor:** legacy shell launch has different error/ownership semantics and elevated commands. Confirm which path the host actually uses before making operational guarantees.
7. **Evidence separation:** tests, disabled sources, authored CI lanes, historical documentation and actual deployed behavior are distinct evidence classes. This audit establishes static contracts only.

## Diagram index

- `persistence-components.mmd`: compiled persistence relationships and durable/runtime boundaries.
- `save-load-sequence.mmd`: save and full ticker-load order with preflight/failure branches.
- `restart-state.mmd`: one-shot restart and fail-closed recovery lifecycle.
- `help-sequence.mmd`: client-session/model/file trust boundaries.
- `services-components.mmd`: external boundaries with explicitly optional/disabled paths.

PlantUML counterparts (`.puml`) are provided for each diagram. They express actual component, sequence or state diagram syntax; rendering is handled by the enclosing audit. Mermaid files remain available.


[Atlas home]({{ '/architecture/' | relative_url }}) · [Diagrams]({{ '/architecture/diagrams/' | relative_url }}) · [Audit]({{ '/architecture/audit/' | relative_url }}) · [Runtime]({{ '/architecture/runtime/' | relative_url }}) · [Persistence & services]({{ '/architecture/persistence/' | relative_url }})
