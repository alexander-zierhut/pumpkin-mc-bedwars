# Replay format (replay.json)

Written by `tests/play/recorder.js`, read by `tests/play/viewer/`. All coordinates are Minecraft world coordinates
(x east, z south, y up). Times `t` are milliseconds since recording start.

```jsonc
{
  "version": 1,
  "meta": {
    "map": "Rewi",
    "recordedAt": "2026-10-23T22:00:00Z",   // ISO timestamp
    "durationMs": 754000,
    "sampleHz": 10,                           // frames per second
    "teams": {
      "Rot":  { "color": "#e53935", "bed": [0, 64, -47], "spawn": [0.5, 64, -39.5] },
      "Blau": { "color": "#1e88e5", "bed": [0, 64, 47],  "spawn": [0.5, 64, 40.5] }
    },
    "spawners": [ { "type": "bronze", "x": -4.5, "y": 64, "z": -45.5 } ],   // bronze | silver | gold
    "players": [ { "name": "Alice", "team": "Rot" } ],                        // team may change from null to a team at game start
    "winner": "Blau"                                                         // or null
  },
  // non-air blocks of the arena when recording starts, y 55..90, x/z -60..60 (also the lobby is excluded)
  "initialBlocks": [ [x, y, z, "blockName"] ],
  // block changes during the game; name "air" = broken
  "blocks": [ { "t": 1234, "x": 0, "y": 64, "z": -20, "name": "red_sandstone", "by": "Alice" } ],   // "by" optional (best effort)
  // sampled state, one entry every 1000/sampleHz ms
  "frames": [
    {
      "t": 100,
      "players": {
        "Alice": { "x": 0.5, "y": 64, "z": -39.5, "yaw": 0, "pitch": 0, "health": 20, "held": "wood_sword",
                   "team": "Rot", "alive": true, "spectator": false, "riding": null }   // riding: "chicken" while gliding
      },
      "entities": [ { "id": 51, "type": "arrow", "x": 1, "y": 66, "z": -10 } ]          // arrow | item | chicken | tnt | villager | fireball | other
    }
  ],
  "events": [
    // type: chat | join | leave | game_start | death | kill | final_kill | bed_destroyed | respawn | buy | win | teleport | parachute | info
    { "t": 5000, "type": "bed_destroyed", "text": "Das Bett von Team Rot wurde von Bob zerstört!", "players": ["Bob"], "team": "Rot" }
  ]
}
```

Notes
- `events[].text` is the plain chat text (German, colour codes stripped). Typed events are best-effort parses of the BedWars
  chat messages plus recorder observations (e.g. a player's y dropping below 30 = void death).
- Viewer must cope with players missing from some frames (disconnects) and with large files (~10 frames/s x 20 min).
