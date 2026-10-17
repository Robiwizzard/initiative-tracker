# Initiative Tracker

A TTRPG initiative tracker for use at the table during combat: turn order, rounds, conditions with durations, AC and HP. Black and green, one page. It is also a [MyDailyApps](../MyDailyApps) app (group `D&D`).

Encounters are saved as JSON files by a small Node server, so MyDailyApps can sync them to Google Drive.

## Run it

Needs Node 24 or newer (see `.nvmrc`).

```
npm ci
npm start
```

`npm ci` also builds the UI (the `prepare` script). Then open <http://127.0.0.1:5180>.

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `5180` | Port to listen on (127.0.0.1 only) |
| `DATA_DIR` | `./data` | Encounters go in `$DATA_DIR/encounters/<name>.json`, your icons and conditions in `$DATA_DIR/custom/library.json` |

Ctrl+C stops it cleanly.

## Use it

- Click the title to rename the encounter. Enter commits, Escape cancels, empty becomes `Default Encounter`.
- **Sort** orders by initiative, highest first (ties keep their order, empty rows sink). **Next / Prev** move the active row and the round counter. Timed conditions tick down at the start of that combatant's turn and drop off at 0.
- **+** in the Conditions cell adds one of the 15 standard conditions, optionally for a number of rounds. Click an applied icon to change its rounds or remove it. Exhaustion stacks as a level (1 to 6).
- Click the icon next to a name to pick a class icon.
- **Custom icons:** in the class picker or a condition editor, "Upload image…" adds your own picture. It is resized to 96 px, shown in full colour and kept in **My icons**, so you can reuse it anywhere.
- **Custom conditions:** click an applied condition to change its name, description and icon (the description shows on hover). "+ New condition…" makes your own, and "Save to my conditions" adds it to the + list for every encounter.
- **Save** (or Ctrl+S) writes `<encounter-name>.json`. **Open** lists saved encounters. A saved name that already belongs to a different encounter asks before overwriting. Deleting only marks the file `"deleted": true`, because cloud sync does not carry deletions.

## Develop

```
npm ci
npm run dev      # Vite on :5173 (proxies /api) + the server on :5180
npm test         # reducer, slug, validation and API tests
npm run build    # client to dist/client, server to dist/server
```

## Layout

`src/shared` types, condition and class lists, slug. `src/server` Express routes, validation and atomic file storage. `src/client` the React UI; all state is one reducer in `state/encounterReducer.ts`.

## Credits

Icons from [game-icons.net](https://game-icons.net) (CC BY 3.0), see [CREDITS.md](CREDITS.md). Conditions come from the D&D 5e SRD (CC BY 4.0).
