# keyboard-positioning Specification

## Purpose
Lets a coach position the selected board item precisely with the keyboard,
in fixed steps, instead of only by dragging it.

## Requirements

### Requirement: Arrow keys move the selected item

When one item is selected, pressing an arrow key SHALL move it 1 pitch unit in
that direction: Left decreases x, Right increases x, Up decreases y, Down
increases y. This applies to players, balls, equipment, lines, shapes and
texts, with any tool active. The distance is in pitch units and SHALL NOT
depend on zoom or screen size.

#### Scenario: Nudge a player right
- **WHEN** a player at (300, 200) is selected and the coach presses Right
- **THEN** the player is at (301, 200)

#### Scenario: Nudge a ball up
- **WHEN** a ball at (525, 340) is selected and the coach presses Up
- **THEN** the ball is at (525, 339)

#### Scenario: Nudge while zoomed in
- **WHEN** the board is zoomed to 300% and a selected cone at (100, 100) is nudged Down
- **THEN** the cone is at (100, 101)

#### Scenario: Other items stay put
- **WHEN** a selected player is nudged
- **THEN** no other player, ball, equipment, line, shape or text changes

### Requirement: Shift moves in larger steps

With Shift held, an arrow key SHALL move the selected item 10 pitch units
instead of 1.

#### Scenario: Shift and Left
- **WHEN** a text at (400, 300) is selected and the coach presses Shift+Left
- **THEN** the text is at (390, 300)

### Requirement: Lines and shapes move as a whole

Nudging a line SHALL move every point of the line, and its curve control
point if it has one, by the same amount, so its shape and length are
unchanged. Nudging a shape SHALL move it without changing its width or height.

#### Scenario: Nudge a straight line
- **WHEN** a selected line from (100, 100) to (200, 150) is nudged Right
- **THEN** the line runs from (101, 100) to (201, 150)

#### Scenario: Nudge a curved line
- **WHEN** a selected curve from (100, 100) to (300, 100) with control point (200, 40) is nudged Down with Shift
- **THEN** it runs from (100, 110) to (300, 110) with control point (200, 50)

#### Scenario: Nudge a shape
- **WHEN** a selected 120 × 80 rectangle at (500, 300) is nudged Left
- **THEN** it is at (499, 300) and is still 120 × 80

### Requirement: Nudges stay on the canvas

A nudge SHALL NOT move an item beyond the canvas, which spans x 0 to 1050 and
y 0 to 680. A step that would cross an edge SHALL be shortened so the item
stops at the edge. For a player, ball, equipment or text the limit applies to
its position; for a line, to every point except the curve control point; for a
shape, to its whole rectangle. An item that already lies beyond an edge SHALL
NOT be moved further out and SHALL still be movable back in.

#### Scenario: Step shortened at the right edge
- **WHEN** a selected player at (1045, 300) is nudged Right with Shift
- **THEN** the player is at (1050, 300)

#### Scenario: Already at the edge
- **WHEN** a selected ball at (0, 340) is nudged Left
- **THEN** the ball stays at (0, 340) and no undo step is added

#### Scenario: Shape stops when its far side reaches the edge
- **WHEN** a selected 100 × 100 shape at (945, 300) is nudged Right with Shift
- **THEN** it is at (950, 300), with its right side on x = 1050

#### Scenario: Line stops when one end reaches the edge
- **WHEN** a selected line from (3, 100) to (200, 100) is nudged Left with Shift
- **THEN** it runs from (0, 100) to (197, 100)

#### Scenario: Item outside the canvas can come back
- **WHEN** an opened file has a cone at (1100, 300), it is selected, and the coach presses Shift+Left
- **THEN** the cone is at (1090, 300)

#### Scenario: Item outside the canvas cannot go further out
- **WHEN** a selected cone at (1100, 300) is nudged Right
- **THEN** the cone stays at (1100, 300)

### Requirement: One undo step per key press

Each press of an arrow key that moves the item SHALL add exactly one undo
step. While the key is held and the move repeats, the repeated moves SHALL
belong to that same step, so one Undo returns the item to where it was before
the key went down. A press that moves nothing SHALL add no undo step.

#### Scenario: Three separate presses
- **WHEN** a selected player at (300, 200) is nudged Right three times with separate key presses and the coach presses Undo once
- **THEN** the player is at (302, 200)

#### Scenario: Key held down
- **WHEN** a selected player at (300, 200) has Right held until it reaches (340, 200), the key is released, and the coach presses Undo once
- **THEN** the player is at (300, 200)

#### Scenario: Redo after undo
- **WHEN** a nudge is undone and the coach presses Redo
- **THEN** the item is back at the nudged position

#### Scenario: Nudge is saved
- **WHEN** an item is nudged and the page is reloaded after autosave has run
- **THEN** the item is at the nudged position

### Requirement: Nudges edit only the selected frame

In a board with more than one frame, a nudge SHALL change the item's position
in the selected frame only, and SHALL treat curved moves the same way a drag
does.

#### Scenario: Other frames are unchanged
- **WHEN** frame 2 of three is selected and a player is nudged Up
- **THEN** that player's position in frames 1 and 3 is unchanged

### Requirement: When arrow keys do not nudge

Arrow keys SHALL NOT move anything, and SHALL keep their normal browser
behaviour, when no item is selected; when focus is in an input, text area,
select or editable text; when Ctrl, Cmd or Alt is held; during playback or
preview; and while a pointer drag is in progress. When an arrow key does
nudge, the page SHALL NOT scroll.

#### Scenario: Nothing selected
- **WHEN** no item is selected and the coach presses Down
- **THEN** nothing on the board moves and no undo step is added

#### Scenario: Typing in the title
- **WHEN** a player is selected, the cursor is in the board title, and the coach presses Left
- **THEN** the cursor moves within the title and the player does not move

#### Scenario: Adjusting a property slider
- **WHEN** a text is selected, focus is on its Font Size slider, and the coach presses Right
- **THEN** the font size changes and the text does not move

#### Scenario: Browser back shortcut
- **WHEN** a player is selected and the coach presses Alt+Left
- **THEN** the player does not move

#### Scenario: During playback
- **WHEN** an animation is playing or previewing and the coach presses Right
- **THEN** no item moves

#### Scenario: During a drag
- **WHEN** the coach is dragging a player with the pointer and presses Up
- **THEN** the drag continues unaffected and the key press moves nothing

### Requirement: Help lists the shortcut

The keyboard shortcuts list in the Help dialog SHALL include arrow-key
nudging and the Shift variant.

#### Scenario: Open Help
- **WHEN** the coach opens Help
- **THEN** the shortcuts list shows that the arrow keys nudge the selected item and that Shift moves it 10 times as far
