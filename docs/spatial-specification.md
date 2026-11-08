# Continuous Entrance Wall · Spatial Specification

## Plan

- Continuous wall: 18.0 m along X, 3.4 m high, 0.4 m thick; front face at z = 0.
- B0: x = 0–4.2 m; B1–B6: six 2.0 m bays, x = 4.2–16.2 m; B7: x = 16.2–18.0 m.
- One continuous display-case band: 12.0 m long, 0.55 m deep, 1.4 m high.
- Visitor movement remains parallel to the wall, constrained to z = 0.83–3.05 m.
- No doorway, transverse route, room beyond the wall, exit arrow, or illuminated threshold.

## Elevation

- Continuous warm wall-washing slot at 3.25 m.
- Graphic band below 2.60 m; object and section labels above the case.
- Continuous brass caption rail at 1.52 m.
- Glass from 0.90 to 1.40 m; limestone plinth below 0.90 m.
- Unbroken 5 mm ink line at 1.35 m, beginning at the vermilion seal in B0 and disappearing into the black vertical slot in B7.
- Seven shallow pilasters divide bays without interrupting the wall.
- All text rectangles are fields, not final graphic panels. Empty fields contain no curatorial copy.

## 90-second storyboard

The timeline reserves 50 seconds for dwell: B0 = 8 seconds; B1–B7 = 6 seconds each. The remaining 40 seconds are distributed equally across seven transitions. Movement speed therefore varies by segment distance; total average speed including dwell is approximately 0.18 m/s.

| Time | Camera / action | Light | Text zones | Sound |
|---|---|---|---|---|
| 0–8 s | B0 dwell, x 0.8 m | Title wash +10% | Title, thesis, rule | Room tone |
| 8–13.7 s | Move B0 → B1 | Continuous slot | Continuous line | Quiet movement |
| 13.7–19.7 s | B1 dwell | 2700 K object spot | Section / caption 01 | Room tone |
| 19.7–31.4 s | Move to B2; dwell 6 s | Case light only | Section / caption 02 | Room tone |
| 31.4–43.1 s | Move to B3; dwell 6 s | Case light only | Section / caption 03 | Room tone |
| 43.1–54.9 s | Move to B4; dwell 6 s | Case light only | Section / caption 04 | Room tone |
| 54.9–66.6 s | Move to B5; dwell 6 s | Case light only | Section / caption 05 | Room tone |
| 66.6–78.3 s | Move to B6; dwell 6 s | Case light only | Section / caption 06 | Room tone |
| 78.3–84 s | Move to B7 | Begin subtle fade | Closing | Room tone |
| 84–90 s | B7 dwell, face black slot | Fade, never illuminate a door | Closing / credits | Fade to silence |

Sound is a storyboard placeholder only; this version does not synthesize or fabricate an audio track.

## Configuration and offline use

- `public/wall.json` is the editable development configuration. Change it and refresh while running the local site.
- `public/wall.schema.json` describes the configuration contract.
- The production `dist/index.html` embeds code and default configuration and can be opened directly without a server.
- The editor imports and exports JSON. Imported GLB models remain local to the active browser session and are not embedded in JSON.
