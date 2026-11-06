---
layout: page
title: TypeSpess
page_class: page-narrow
lead: A TypeScript and Node.js remake of Civ13, based on the Bluespess engine.
description: Explore the TypeScript and Node.js remake of Civ13, based on the Bluespess engine.
image:
  path: /public/img/banner.png
  width: 450
  height: 232
  alt: Civilization 13 game banner
---
This is an attempt at remaking Civ13, a [BYOND](http://www.byond.com/) game, using [TypeScript](https://www.typescriptlang.org/) and [Node.js](https://nodejs.org/). This is loosely forked from the [Bluespess](https://github.com/Bluespess) engine, a JavaScript remake of the [/tg/station codebase](https://github.com/tgstation/tgstation) of [SS13](http://www.byond.com/games/Exadv1/SpaceStation13), also a BYOND game.

Check the original Civ13 [here](https://github.com/civ13/civ13).

[Source code and issues](https://github.com/Civ13/civ13-typespess) · [License (AGPL v3)](https://github.com/Civ13/civ13-typespess/blob/master/LICENSE)

**Please read the [Contribution Guide](https://github.com/Civ13/civ13-typespess/blob/master/.github/CONTRIBUTING.md) page if you're willing to help! All help is appreciated!**

## Installing

### Windows

1. Install node.js 14 or later from https://nodejs.org/en/download/
2. Clone `https://github.com/civ13/civ13-typespess.git` using your preferred git software, or download the ZIP file from github and extract it (not recommended).
3. Run `setup.bat` in the civ13-typespess/scripts folder.

Whenever you update to the latest code, run `setup.bat` again afterwards for the simplest and easiest experience.

### Linux (Ubuntu)

1. If you don't have it yet, install git using `apt install git`.
2. Clone the repo using `git clone https://github.com/civ13/civ13-typespess.git`.
3. Run `setup.sh` in the civ13-typespess/scripts folder.

Whenever you update to the latest code, run `setup.sh` again afterwards for the simplest and easiest experience.

## Running

Run `launch_server.bat` or `launch_server.sh` in the civ13-typespess/scripts folder. To join the server (locally) connect to `localhost:1713` using a web browser. To connect remotely, replace localhost with the IP address.

If you have the database login system enabled (in **server.cson**), you also need to launch the **PouchDB** using `start_db.bat` or `start_db.sh`.

You can also use `launch_client.bat` to automatically update the dependencies and launch the game on the browser (Windows only).

## Licenses

All code is licensed under [GNU AGPL v3](https://www.gnu.org/licenses/agpl-3.0.html).
