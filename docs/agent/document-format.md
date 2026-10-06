# Tactical Board document format (schema version 3)

This is the reference for writing a Tactical Board document by hand or with an
AI agent. A document is one JSON file with the extension `.tacticalboard`. One
frame is a static board; two or more frames are an animation.

The app validates a document every time one is opened and rejects it with the
path of the first problem. It also reports advisory warnings (§7). §9 explains
how to check and open a document.

## 1. Document

```json
{
  "kind": "tactical-board-document",
  "schemaVersion": 3,
  "title": "Wall pass",
  "settings": { "pitchType": "blank", "matchFormat": "7v7", "halfPitchTeam": "B" },
  "frames": [ ... ]
}
```

| Field | Type | Rules |
|---|---|---|
| `kind` | string | Exactly `"tactical-board-document"` |
| `schemaVersion` | number | `3` |
| `title` | string | Up to 200 characters; shown in the header and used as the file name |
| `settings.pitchType` | string | `"full"`, `"half"` or `"blank"` (see §2) |
| `settings.matchFormat` | string | `"11v11"`, `"9v9"` or `"7v7"`. It does not change the pitch size. It turns on the 7v7 build-out lines, picks the sidebar's preset list, and sets the team size the checker warns about. Usual age groups: 7v7 for U9–U10, 9v9 for U11–U12, 11v11 from U13 |
| `settings.halfPitchTeam` | string | `"A"` or `"B"`. Required. It does not affect how a document is drawn (it only tells the app which squad to create for a new half-pitch board), so always use `"B"` |
| `settings.selectedFormations` | object | Optional. Only highlights a preset in the sidebar, for example `{ "7v7": { "teamA": "2-3-1", "teamB": null } }`. Keys are match formats; values are preset names from §6 or `null`. Leave it out if unsure |
| `frames` | array | 1 to 100 frames (see §3) |

Unknown fields are dropped on import. The file must be under 5 MB.

## 2. Pitch and coordinates

All positions are in logical pitch units on a 1050 × 680 canvas. **x grows to
the right, y grows downward.** The field itself is inset: its touchlines are at
y = 30 and y = 650, its goal lines at x = 40 and x = 1010. Keep everything
inside the canvas, and players inside the field unless they are deliberately
off it.

The match format does not change the markings. A 7v7 or 9v9 board uses the same
field, with fewer players. The only format-specific marking is the pair of 7v7
build-out lines.

### Full pitch (`"full"`)

Team A defends the **left** goal and attacks right. Team B defends the right
goal and attacks left. Make the coach's own team Team A unless told otherwise.

Because y grows downward, Team A's **right** side is the **bottom** of the
screen (high y) and its left side is the top (low y). Team B faces the other
way, so Team B's right side is the **top** (low y) and its left side is the
bottom.

| Landmark | Coordinates |
|---|---|
| Centre spot | (525, 340) |
| Halfway line | x = 525 |
| Centre circle | radius 90 around (525, 340) |
| Left goal mouth | x = 40, y from 301 to 379 |
| Right goal mouth | x = 1010, y from 301 to 379 |
| Left penalty area | x 40 to 200, y 154 to 526 |
| Right penalty area | x 850 to 1010, y 154 to 526 |
| Left goal area | x 40 to 93, y 253 to 427 |
| Right goal area | x 957 to 1010, y 253 to 427 |
| Penalty spots | (147, 340) and (903, 340) |
| Corners | (40, 30), (40, 650), (1010, 30), (1010, 650) |
| Goal nets | 24 units deep behind each goal line (x 16 to 40 and x 1010 to 1034) |
| 7v7 build-out lines | x = 312 and x = 738 (drawn only when `matchFormat` is `"7v7"`) |

On Team A's goal kick, Team B must wait at x ≥ 312 until the ball is played; on
Team B's goal kick, Team A must wait at x ≤ 738.

Scale: the field is 970 units long, so 1 metre is about 9 units on an 11-a-side
pitch. For small-sided formats the markings (including the penalty areas) stay
at these 11-a-side proportions; treat the field as the whole pitch and think in
proportions (thirds, half-spaces) instead of metres.

### Half pitch (`"half"`)

One goal at the **top**, the halfway line at the **bottom**. Any mix of teams
can be placed on it; nothing is hidden. The half is drawn larger than on the
full pitch (about 1.5 times), so full-pitch distances and presets do not carry
over.

- **Defending team:** goalkeeper in front of the goal near (525, 70), back line
  below it. Facing down the screen, its right side is the **left** of the
  screen (low x).
- **Attacking team:** starts toward the bottom and attacks upward. Its right
  side is the **right** of the screen (high x).
- In an attacking drill (finishing, crossing) make the attackers Team A and
  the goalkeeper and any defenders Team B; in a defending drill, the reverse.
- To place a formation for the defending team, as the app does, map Team A's
  preset `(x, y)` to about
  `(40 + (650 − y) × 1.565, 30 + (x − 40) × 1.278)`. Place attackers by hand.

| Landmark | Coordinates |
|---|---|
| Goal line | y = 30 |
| Touchlines | x = 40 and x = 1010 |
| Goal mouth | y = 30, x from 457 to 593; net 24 units deep above it (y 6 to 30) |
| Penalty area | x 244 to 806, y 30 to 228 |
| Goal area | x 394 to 656, y 30 to 98 |
| Penalty spot | (525, 160) |
| Halfway line | y = 650, centre spot (525, 650), circle radius 136 |
| 7v7 build-out line | y = 377 |

### Blank pitch (`"blank"`)

Grass with no markings. Use it for drills marked out with cones (rondos,
grids, 1v1s). The whole canvas is available and nothing is to scale: size the
area so the tokens read clearly, not in metres. A square of 250 to 350 units
centred near (525, 340) suits a rondo or small-sided grid; state the real
dimensions in `notes`. Mark the area with a cone on each corner, optionally
with a faint rectangle shape behind it. Formation presets do not apply. Give
the two groups different teams so they read apart, for example the outside
players of a rondo as Team A and the defenders as Team B.

## 3. Frames

```json
{
  "id": "frame-1",
  "title": "Pass",
  "players": [],
  "balls": [],
  "equipments": [],
  "lines": [],
  "shapes": [],
  "texts": [],
  "notes": "Pass into the wall player.",
  "holdMs": 800,
  "durationMs": 1000,
  "paths": { "p1": { "x": 500, "y": 560 } }
}
```

| Field | Type | Rules |
|---|---|---|
| `id` | string | Non-empty, unique among frames |
| `title` | string | Frame label, may be `""`; up to 200 characters |
| `players`, `balls` | array | Required, may be empty. Up to 100 players and 50 balls |
| `equipments`, `lines`, `shapes`, `texts` | array | Optional, default empty. Up to 500 each |
| `notes` | string | Optional coaching notes, up to 10 000 characters |
| `holdMs` | integer | 0 to 30 000. How long this frame stands still before moving on |
| `durationMs` | integer | 100 to 30 000. How long the move to the **next** frame takes. Required on every frame; ignored on the last |
| `paths` | object | Optional curved moves, see §5 |

Every `id` inside a frame must be unique across all six collections. Use short
readable IDs such as `a-gk`, `b-st`, `ball-1`, `cone-3`, `pass-2`. Annotation
IDs may repeat from frame to frame: keep the same ID for something that stays
(a cone, a zone), and use a new ID for each frame's arrows and caption.

Drawing order, back to front: shapes, lines and texts; then equipment; then
balls; then players. Players are always on top.

`notes` is plain text (line breaks allowed) shown in the sidebar for the
selected frame and printed on the PDF. Two to four sentences per frame is
plenty.

A single-frame document is a static board: give its frame `"holdMs": 0` and
`"durationMs": 1000`.

## 4. Entities

Colours are `#rrggbb` hex strings. Each entity lists its required fields;
everything described as optional can be left out.

### Player

```json
{ "id": "a-rd", "team": "A", "number": "2", "name": "RD", "x": 240, "y": 470,
  "color": "#ef4444", "textColor": "#ffffff", "radius": 17, "facingAngle": 0 }
```

| Field | Rules |
|---|---|
| `team` | `"A"`, `"B"`, `"neutral"` or `"custom"` |
| `number` | String shown on the token, for example `"9"`. May be `""` |
| `name` | Optional small label under the token (about 9 units tall), for example a role (`"CM"`). Keep it to a few characters |
| `x`, `y` | Centre of the token. Tokens touch at 34 units apart, so keep centres at least 36 apart; go down to 30 only to show tight marking |
| `color`, `textColor` | Token fill and number colour |
| `isGoalkeeper` | Optional boolean. Draws a heavier outline and a keeper marker; it does not set the colour |
| `radius` | Optional, default and recommended `17` |
| `facingAngle` | Optional degrees: 0 faces right, 90 faces down, 180 faces left, 270 faces up |
| `showVisionCone` | Optional boolean. The facing direction is only drawn when this is `true` |

Standard colours:

| Team | Outfield | Goalkeeper |
|---|---|---|
| A | `#ef4444` (red) | `#eab308` (yellow) |
| B | `#3b82f6` (blue) | `#10b981` (green) |
| neutral | `#a855f7` (purple) | `#f97316` (orange) |

Use `textColor` `#ffffff` with all of these. Required: `id`, `team`, `number`,
`x`, `y`, `color`, `textColor`.

A token cannot change team or colour during an animation. If players swap
roles (a defender wins the ball and becomes an attacker), show it by position
and say so in the caption and notes.

### Ball

```json
{ "id": "ball-1", "x": 108, "y": 340, "size": 11 }
```

`size` is the ball's radius and is optional (use `11`); `rotation` is optional
and rarely needed. A ball is never attached to a player, and players are drawn
on top of balls. To show a player in possession, place the ball about 26 units
from the player's centre so it sits just clear of the token, on the side of
their next action (the next pass or dribble). If there is no next action, put
it on the side facing the opponent's goal. For a goal, put the ball inside the
net.

### Equipment

```json
{ "id": "cone-1", "type": "cone-orange", "x": 500, "y": 430 }
```

`type` is one of `cone-orange`, `cone-yellow`, `cone-blue`, `mannequin`,
`mini-goal`, `ladder`, `pole`. Required: `id`, `type`, `x`, `y`. Optional
`scale` (default 1). `rotation` is accepted but not drawn.

Sizes at scale 1: a cone is about 20 units across, a mannequin about 28 wide
and 40 tall, a mini-goal a 44 × 28 rectangle with no visible front, so use it
only where its direction is obvious. A gate is two cones 60 to 100 units
apart. Keep runs and passes about 30 units clear of equipment.

### Line

```json
{ "id": "pass-1", "type": "pass", "points": [{ "x": 126, "y": 340 }, { "x": 220, "y": 470 }],
  "color": "#ffffff", "width": 3, "style": "dashed", "arrowEnd": "arrow" }
```

| `type` | Meaning | Use with |
|---|---|---|
| `straight` | Player run | `"style": "solid"`, `"arrowEnd": "arrow"` |
| `pass` | Ball pass (always drawn dashed) | `"style": "dashed"`, `"arrowEnd": "arrow"` |
| `dribble` | Dribble (drawn wavy) | `"style": "wavy"`, `"arrowEnd": "arrow"` |
| `curve` | Curved run or pass | `"style": "solid"`, `"arrowEnd": "arrow"`, plus `controlPoint` |
| `block` | Block or screen | `"style": "solid"`, `"arrowEnd": "t-bar"` |
| `freehand` | Free drawing through all `points` (up to 5 000) | `"style": "solid"` |

- Required: `id`, `type`, `points`, `color`, `width`, `style`.
- `points` needs at least two entries: `[start, end]`. Only freehand uses more.
- `controlPoint` (`{ "x", "y" }`) is the quadratic Bézier control point of a
  `curve`. Without it the curve gets a slight default bend. To match a curved
  move, use the same control point as that entity's `paths` entry (§5 rule 10).
- `style` is `solid`, `dashed`, `dotted` or `wavy`. A `pass` is dashed and a
  `dribble` is wavy whatever `style` says. A `curve` honours `style`, so a
  curved pass or cross is `"type": "curve"` with `"style": "dashed"`.
- `arrowStart` and `arrowEnd` are `none`, `arrow`, `t-bar`, `ball` or
  `double-arrow`. Stick to `arrow`, `t-bar` and `none`.
- `width` 3 to 4 reads well.

Conventions:

| Action | Line |
|---|---|
| Pass, cross or shot | `pass` (or dashed `curve`), `#ffffff` |
| Dribble | `dribble`, `#ffffff` |
| Run by the coached team | `straight` (or solid `curve`), `#facc15` yellow |
| Run or press by the opposition | `straight`, `#93c5fd` light blue |
| Intercepted pass | `pass` drawn from the passer to the interception point; the ball moves to the interceptor |

- **Where a line starts:** a run starts about 24 units from the runner's
  centre, at the token's edge. A pass, shot or dribble starts just beyond the
  ball, about 40 units from the centre of the player who has it.
- **Where a line ends:** a pass ends about 24 units short of the receiver's
  centre (or of the interceptor's). A run or dribble ends at the point the
  player arrives at; if another token stands there in this frame, stop 24
  units short of it. A shot ends inside the net.
- **How many:** draw the one to five arrows that carry the frame's idea. The
  key action always gets an arrow, however short. Minor adjustments (a keeper
  shuffling, a cover player sliding) and other moves under about 40 units need
  none.

### Shape

```json
{ "id": "zone-1", "type": "rectangle", "x": 40, "y": 154, "width": 272, "height": 372,
  "color": "#facc15", "fillOpacity": 0.2, "strokeColor": "#facc15", "strokeWidth": 2 }
```

`type` is `rectangle` or `circle` (`polygon` is accepted but not drawn
usefully). `x`, `y` is the top-left corner of the bounding box; a circle is the
ellipse inscribed in that box. `color` is the fill, at `fillOpacity` (0.1 to
0.25 reads well); `strokeColor` and `strokeWidth` are the dashed outline. All
fields in the example are required. Optional `label` is drawn in white 13-unit
text at the centre of the shape.

### Text

```json
{ "id": "caption-1", "x": 48, "y": 21, "text": "1. Goal kick", "fontSize": 13,
  "color": "#ffffff", "bgColor": "#0f172a", "bgOpacity": 0.9, "isBold": true,
  "align": "left", "borderStyle": "solid", "borderColor": "#334155" }
```

Required: `id`, `x`, `y`, `text`, `fontSize`, `color`. The rest are optional;
copy them from the example for a readable dark caption box.

- `x`, `y` is the left end of the first line's baseline. The background box
  starts 12 units left of `x` and about 25 units above `y`.
- Text never wraps. A line is about `characters × fontSize × 0.58` units wide,
  plus 24 for the box: at `fontSize` 13 that is 7.5 units per character. Use
  `\n` for a second line.
- `text` may contain `**bold**` / `*italic*` markers, up to 2 000 characters.
  `isBold` and `isItalic` are booleans that style the whole text instead.
  `align` is `left`, `center` or `right` (alignment inside the box);
  `borderStyle` is `none`, `solid` or `dashed`.
- **Captions:** one per frame, at most 60 characters, describing the action
  that leaves the frame (the last frame describes the outcome). On the full
  pitch put it
  at `x = 48, y = 21`, in the margin above the top touchline. On the half pitch
  the goal net occupies x 457 to 593 of that margin, so keep the caption to 50
  characters. On a blank pitch put it about 40 units above the top of the
  drill area, starting at its left edge.

## 5. Animation rules

1. **Every frame is a complete snapshot.** List every player, ball and
   annotation in every frame, including those that do not move.
2. **The same players and balls in every frame.** The set of player IDs and the
   set of ball IDs must be identical across frames, or the document is
   rejected. Nobody can enter or leave mid-animation; park an unused player at
   the side instead.
3. **Only position changes.** Between frames a player may change `x`, `y`,
   `facingAngle` and `showVisionCone`; a ball may change `x`, `y` and
   `rotation`. Everything else (team, number, name, colours, radius, size) must
   be copied unchanged.
4. **Movement is the difference between two frames.** Players and balls travel
   in a straight line at constant speed from their position in frame *i* to
   their position in frame *i + 1*, taking frame *i*'s `durationMs`. An entity
   with the same position in both frames stands still.
5. **One clock per transition.** Everything that moves between two frames
   starts and arrives together. To have a pass arrive before a run starts, use
   two transitions. When a whole team reacts to one pass (a press, a shift),
   start everyone in that same transition; do not leave players standing still
   for the sake of a tidier frame. A player with too far to go at a believable
   speed finishes the run in the next transition. A player who should arrive
   late can take a longer curved path. Players with a fixed station (the
   outside players of a rondo) can stay put.
6. **A pass is the ball changing position.** Put the ball at the passer in
   frame *i* and at the receiver in frame *i + 1*. For a dribble, move the
   player and the ball together. For an interception, move the ball to the
   interceptor instead of the intended receiver.
7. **Timeline.** Playback holds frame 1 for its `holdMs`, moves for its
   `durationMs`, holds frame 2, and so on, ending on the last frame's hold. The
   total must not exceed 10 minutes.
8. **Annotations are per frame and do not animate.** Equipment, lines, shapes,
   texts and notes belong to one frame. During a transition the departing
   frame's annotations stay visible, then switch on arrival. Repeat cones and
   other fixed items in every frame.
9. **Arrows are drawings, not motion.** A line never moves anything. In frame
   *i*, draw the arrows for what happens on the way to frame *i + 1*, and leave
   the last frame without arrows.
10. **Curved moves.** `paths` on frame *i* maps a player or ball ID to a
    control point. That entity then travels to frame *i + 1* along the
    quadratic Bézier curve from its position, bent toward the control point,
    still at constant speed. To make the curve pass through a point M halfway,
    use `control = 2·M − (start + end) / 2`. `paths` on the last frame does
    nothing.

Pacing that reads well: 1 000 to 1 500 ms per move, 300 to 800 ms holds
between moves, 1 500 ms or more on the first and last frames. A shot or a
short pass can take 400 to 800 ms. Aim for 3 to 8 frames per drill (a sequence
of N actions needs N + 1 frames).

Keep speeds believable. On the full pitch a sprinting player covers about 70
units per second and a pass 150 to 250; on the half pitch, which is drawn
larger, about 105 and 225 to 375. If a run needs more than that, lengthen
`durationMs` (going past 1 500 ms is fine) or shorten the run. An intercepted
pass may be slower. A blank pitch has no scale: keep moves between 1 000 and
2 000 ms and similar distances at similar speeds.

## 6. Formation presets

Positions for Team A on the full pitch, as `role number (x,y)`. For Team B,
mirror both axes: `x → 1050 − x` and `y → 680 − y`, so that Team B's right
back is on Team B's right (the top of the screen).

| Format | Preset | Players |
|---|---|---|
| 11v11 | 4-3-3 | GK 1 (80,340), RB 2 (260,550), CB 4 (220,420), CB 5 (220,260), LB 3 (260,130), DM 6 (360,340), CM 8 (440,460), AM 10 (440,220), RW 7 (500,550), ST 9 (500,340), LW 11 (500,130) |
| 11v11 | 4-2-3-1 | GK 1 (80,340), RB 2 (250,550), CB 4 (210,420), CB 5 (210,260), LB 3 (250,130), DM 6 (340,400), DM 8 (340,280), RM 7 (460,540), CAM 10 (450,340), LM 11 (460,140), ST 9 (500,340) |
| 11v11 | 4-4-2 | GK 1 (80,340), RB 2 (250,550), CB 4 (220,420), CB 5 (220,260), LB 3 (250,130), RM 7 (380,550), CM 8 (360,400), CM 6 (360,280), LM 11 (380,130), ST 9 (490,390), ST 10 (490,290) |
| 11v11 | 3-5-2 | GK 1 (80,340), RCB 4 (220,470), CB 5 (200,340), LCB 6 (220,210), RWB 2 (370,570), CM 8 (350,420), CAM 10 (420,340), CM 7 (350,260), LWB 3 (370,110), ST 9 (490,400), ST 11 (490,280) |
| 11v11 | 3-4-3 | GK 1 (80,340), RCB 4 (220,480), CB 5 (200,340), LCB 6 (220,200), RM 2 (370,550), CM 8 (360,400), CM 10 (360,280), LM 3 (370,130), RW 7 (490,520), ST 9 (500,340), LW 11 (490,160) |
| 11v11 | 5-3-2 | GK 1 (80,340), RWB 2 (260,570), RCB 4 (200,450), CB 5 (180,340), LCB 6 (200,230), LWB 3 (260,110), RCM 7 (360,450), CM 8 (340,340), LCM 10 (360,230), ST 9 (480,400), ST 11 (480,280) |
| 9v9 | 3-2-3 | GK 1 (90,340), RB 2 (250,530), CB 4 (220,340), LB 3 (250,150), CM 6 (360,420), CM 8 (360,260), RW 7 (480,530), ST 9 (490,340), LW 11 (480,150) |
| 9v9 | 3-3-2 | GK 1 (90,340), RB 2 (250,530), CB 4 (220,340), LB 3 (250,150), RM 7 (370,520), CM 8 (360,340), LM 11 (370,160), ST 9 (490,400), ST 10 (490,280) |
| 9v9 | 4-3-1 | GK 1 (90,340), RB 2 (250,540), CB 4 (210,410), CB 5 (210,270), LB 3 (250,140), RM 7 (370,500), CM 8 (360,340), LM 11 (370,180), ST 9 (490,340) |
| 9v9 | 3-4-1 | GK 1 (90,340), RCB 4 (230,490), CB 5 (210,340), LCB 6 (230,190), RM 2 (360,540), CM 8 (350,400), CM 10 (350,280), LM 3 (360,140), ST 9 (490,340) |
| 9v9 | 2-3-3 | GK 1 (90,340), RCB 4 (220,440), LCB 5 (220,240), RM 7 (340,530), CM 8 (330,340), LM 11 (340,150), RW 10 (480,520), ST 9 (490,340), LW 17 (480,160) |
| 7v7 | 2-3-1 | GK 1 (90,340), RD 2 (240,470), LD 3 (240,210), RM 7 (360,530), CM 8 (350,340), LM 11 (360,150), ST 9 (480,340) |
| 7v7 | 3-2-1 | GK 1 (90,340), RWB 2 (250,520), CB 4 (220,340), LWB 3 (250,160), CM 8 (370,420), CM 10 (370,260), ST 9 (480,340) |
| 7v7 | 1-3-2 | GK 1 (90,340), CB 4 (220,340), RM 7 (340,520), CM 8 (330,340), LM 11 (340,160), ST 9 (480,420), ST 10 (480,260) |
| 7v7 | 2-2-2 | GK 1 (90,340), RD 2 (240,460), LD 3 (240,220), RCM 8 (350,460), LCM 6 (350,220), RST 9 (480,460), LST 10 (480,220) |
| 7v7 | 3-1-2 | GK 1 (90,340), RB 2 (240,510), CB 4 (210,340), LB 3 (240,170), DM 8 (340,340), ST 9 (480,410), ST 10 (480,270) |

Formations are written without the goalkeeper here. A coach who says "1-2-3-1"
in 7v7 means the keeper plus the `2-3-1` preset. These presets sit in the
team's own half; push players up or spread them for the situation you are
showing. They apply to the full pitch only; see §2 for the half pitch, and
ignore them for grid drills on a blank pitch.

## 7. Warnings

A valid document can still look wrong. The app's Paste from AI dialog and the
command-line checker (§9) warn when:

- a player, ball, cone, text, shape, line point or curve control point is
  outside the 1050 × 680 canvas;
- two players in the same frame are closer than 24 units (their tokens
  overlap);
- a player or ball changes anything other than its pose between frames (rule 3);
- a line has fewer than two points, so it is not drawn;
- a colour is not `#rrggbb`;
- a text box runs past the right edge of the canvas;
- team A or team B has more players than the match format allows;
- the last frame has `paths`.

Fix every warning unless it is intended.

The warnings do not judge the football. They cannot see a pass that runs
through an opponent, an arrow hidden under a token, a ball left away from every
player, or a run that is too fast. Check those yourself.

Passing lanes: measure from where the ball starts to where it ends, against
each opponent's position in the frame the pass leaves. Keep them at least 30
units off that line unless the lane is meant to be blocked. A presser who
arrives at the receiver, or an interceptor, will end near the line; that is
expected. The rule does not apply to a shot and the goalkeeper.

## 8. Complete example

A wall pass on a blank pitch: three frames, two players, one ball, one cone,
one pass arrow and one curved run.

```json
{
  "kind": "tactical-board-document",
  "schemaVersion": 3,
  "title": "Wall pass",
  "settings": { "pitchType": "blank", "matchFormat": "7v7", "halfPitchTeam": "B" },
  "frames": [
    {
      "id": "frame-1",
      "title": "Pass",
      "players": [
        { "id": "p1", "team": "A", "number": "7", "name": "Runner", "color": "#ef4444", "textColor": "#ffffff", "radius": 17, "x": 300, "y": 440 },
        { "id": "p2", "team": "A", "number": "9", "name": "Wall", "color": "#ef4444", "textColor": "#ffffff", "radius": 17, "x": 500, "y": 280 }
      ],
      "balls": [{ "id": "ball-1", "x": 326, "y": 440, "size": 11 }],
      "equipments": [{ "id": "cone-1", "type": "cone-orange", "x": 500, "y": 430 }],
      "lines": [
        { "id": "pass-1", "type": "pass", "points": [{ "x": 344, "y": 424 }, { "x": 482, "y": 296 }], "color": "#ffffff", "width": 3, "style": "dashed", "arrowEnd": "arrow" }
      ],
      "shapes": [],
      "texts": [],
      "notes": "Pass into the wall player.",
      "holdMs": 800,
      "durationMs": 1000
    },
    {
      "id": "frame-2",
      "title": "Run and return",
      "players": [
        { "id": "p1", "team": "A", "number": "7", "name": "Runner", "color": "#ef4444", "textColor": "#ffffff", "radius": 17, "x": 300, "y": 440 },
        { "id": "p2", "team": "A", "number": "9", "name": "Wall", "color": "#ef4444", "textColor": "#ffffff", "radius": 17, "x": 500, "y": 280 }
      ],
      "balls": [{ "id": "ball-1", "x": 500, "y": 306, "size": 11 }],
      "equipments": [{ "id": "cone-1", "type": "cone-orange", "x": 500, "y": 430 }],
      "lines": [],
      "shapes": [],
      "texts": [],
      "notes": "Runner curves around the cone (the defender); the wall player lays the ball into the run.",
      "holdMs": 200,
      "durationMs": 1500,
      "paths": {
        "p1": { "x": 500, "y": 560 }
      }
    },
    {
      "id": "frame-3",
      "title": "Finish",
      "players": [
        { "id": "p1", "team": "A", "number": "7", "name": "Runner", "color": "#ef4444", "textColor": "#ffffff", "radius": 17, "x": 700, "y": 440 },
        { "id": "p2", "team": "A", "number": "9", "name": "Wall", "color": "#ef4444", "textColor": "#ffffff", "radius": 17, "x": 500, "y": 280 }
      ],
      "balls": [{ "id": "ball-1", "x": 726, "y": 440, "size": 11 }],
      "equipments": [{ "id": "cone-1", "type": "cone-orange", "x": 500, "y": 430 }],
      "lines": [],
      "shapes": [],
      "texts": [],
      "holdMs": 1500,
      "durationMs": 1000
    }
  ]
}
```

## 9. Checking and opening a document

- **Paste from AI (in the app):** the "Paste from AI" button in the header,
  next to Load (on a phone it is in the File menu). Paste the JSON. The dialog says whether the document is valid, lists the warnings
  from §7, and opens the document on the board. Its "Copy feedback" button
  copies the error or warnings so they can be sent back to the assistant that
  wrote the document.
- **Open a file:** the app's Load button accepts `.tacticalboard` files.
- **Command line (in the app's repository):**

  ```
  npm run check:board -- my-drill.tacticalboard
  ```

  It prints `VALID` (with the title, counts and running time) or `INVALID`
  with the path of the first problem, then `Warnings (n):` with one line per
  warning, then a share link that opens the document in the app. The file can
  be anywhere; pass a relative or absolute path. Add
  `--base-url http://localhost:5173/` to target a local dev server.

A document has passed when it is valid and every warning is fixed or intended.

A share link is `<app url>#share=1.<payload>`, where the payload is the JSON
text compressed with raw DEFLATE and encoded as unpadded base64url. Opening it
asks the user to confirm, then loads the document.
