---
layout: default
title: "Source coverage"
permalink: /architecture/coverage/
description: "Source-pinned Civ13 architecture, UML diagrams, evidence boundaries and downloadable audit artifacts."
image:
  path: /public/img/architecture-overview.png
  width: 1922
  height: 573
  alt: Civ13 architecture component overview
---

[Atlas home]({{ '/architecture/' | relative_url }}) · [Diagrams]({{ '/architecture/diagrams/' | relative_url }}) · [Audit]({{ '/architecture/audit/' | relative_url }}) · [Runtime]({{ '/architecture/runtime/' | relative_url }}) · [Persistence & services]({{ '/architecture/persistence/' | relative_url }})

# Source-group coverage

Counts are lexical include-union inventory, not proven runtime coverage.

| Source group | Files | Lines | Proc candidates | Type declarations | Call sites |
|---|---:|---:|---:|---:|---:|
| code/__defines | 41 | 1966 | 15 | 0 | 43 |
| code/_globalvars | 1 | 25 | 0 | 0 | 18 |
| code/_helpers | 30 | 5970 | 350 | 9 | 1255 |
| code/_onclick | 15 | 3702 | 244 | 94 | 714 |
| code/controllers | 6 | 1675 | 51 | 5 | 187 |
| code/datums | 26 | 3168 | 151 | 39 | 687 |
| code/game/area | 2 | 1757 | 11 | 363 | 131 |
| code/game/atoms.dm | 1 | 606 | 39 | 1 | 233 |
| code/game/atoms_movable.dm | 1 | 318 | 20 | 2 | 81 |
| code/game/base_turf.dm | 1 | 14 | 2 | 0 | 2 |
| code/game/core.dm | 1 | 41 | 1 | 0 | 11 |
| code/game/dna | 2 | 459 | 33 | 1 | 127 |
| code/game/gameticker.dm | 1 | 346 | 8 | 1 | 68 |
| code/game/jobs | 2 | 1015 | 24 | 2 | 237 |
| code/game/lobby_music_player.dm | 1 | 53 | 4 | 1 | 14 |
| code/game/mob | 172 | 44254 | 1703 | 630 | 12891 |
| code/game/objects | 373 | 94620 | 4123 | 3407 | 25427 |
| code/game/sound.dm | 1 | 657 | 4 | 0 | 223 |
| code/game/turfs | 21 | 6818 | 204 | 561 | 1712 |
| code/js | 1 | 37 | 0 | 0 | 0 |
| code/modules/1713 | 238 | 135131 | 3744 | 5578 | 49598 |
| code/modules/admin | 54 | 10568 | 299 | 30 | 2998 |
| code/modules/chat | 1 | 128 | 7 | 2 | 31 |
| code/modules/client | 18 | 2687 | 136 | 37 | 658 |
| code/modules/collectibles | 3 | 1770 | 38 | 111 | 266 |
| code/modules/dmm_suite | 2 | 304 | 9 | 2 | 81 |
| code/modules/error_handler | 4 | 353 | 14 | 4 | 67 |
| code/modules/flufftext | 2 | 106 | 6 | 0 | 40 |
| code/modules/lighting | 9 | 1130 | 63 | 6 | 184 |
| code/modules/magic | 15 | 7686 | 260 | 278 | 1878 |
| code/modules/materials | 2 | 2353 | 79 | 170 | 180 |
| code/modules/multiz | 7 | 1087 | 67 | 42 | 279 |
| code/modules/nano | 23 | 1611 | 116 | 14 | 427 |
| code/modules/organs | 15 | 3642 | 190 | 69 | 855 |
| code/modules/persistence | 14 | 2896 | 173 | 26 | 1408 |
| code/modules/projectiles | 18 | 6968 | 220 | 321 | 1572 |
| code/modules/reagents | 40 | 17735 | 872 | 1111 | 4125 |
| code/modules/research_tree | 7 | 3104 | 63 | 6 | 682 |
| code/modules/statpanel | 1 | 180 | 6 | 1 | 69 |
| code/modules/submarine | 12 | 6282 | 220 | 94 | 1135 |
| code/modules/surgery | 12 | 1787 | 128 | 39 | 649 |
| code/modules/webhooks | 1 | 49 | 11 | 0 | 21 |
| code/modules/xgm | 2 | 387 | 25 | 3 | 55 |
| code/processes | 43 | 4557 | 305 | 51 | 1019 |
| code/root | 14 | 3103 | 43 | 8 | 534 |
| interface | 1 | 173 | 0 | 12 | 3 |


[Atlas home]({{ '/architecture/' | relative_url }}) · [Diagrams]({{ '/architecture/diagrams/' | relative_url }}) · [Audit]({{ '/architecture/audit/' | relative_url }}) · [Runtime]({{ '/architecture/runtime/' | relative_url }}) · [Persistence & services]({{ '/architecture/persistence/' | relative_url }})
