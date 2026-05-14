# AGENTS.md

## Project overview

This repository contains a small browser app for visualizing and interacting with a MIDI piano keyboard.

It is not a Smart TV app. Do not apply Tizen, WebOS, HbbTV, TV remote-control, or Smart TV packaging assumptions unless a future task explicitly adds that target.

The current app is plain HTML, CSS, and JavaScript:

- `src/index.html` loads the page.
- `src/app.css` contains page-level styles.
- `src/components/keyboard/keyboard.js` defines the `<midi-keyboard>` web component and the global `Piano` API.

The app uses the browser Web MIDI API when available. It should continue to work as a regular browser page even when MIDI access is unavailable.

## Main rules

- Prefer simple, explicit JavaScript.
- Do not use TypeScript unless the project is intentionally migrated.
- Do not introduce a framework or build system unless clearly requested.
- Do not introduce new dependencies unless clearly justified.
- Preserve the existing custom element approach.
- Keep changes minimal and focused.
- Do not reformat unrelated files.
- Add defensive checks for undefined/null values where user input, MIDI input, or DOM lookup may fail.
- Prefer readable code over clever abstractions.
- Keep public interfaces backward compatible when changing function signatures.

## JavaScript rules

- Use plain JavaScript modules and browser APIs.
- Keep state handling simple and explicit.
- Avoid repeated DOM updates in loops; build HTML strings or fragments, then update the DOM once.
- Avoid expensive calculations in rendering or MIDI event handlers.
- Keep MIDI note numbering consistent with the standard range `0..127`.
- Use the existing note/octave convention: MIDI `60` is `Do4` / `C4`, the central C.
- If adding public methods, expose them through the existing `Piano` object only when they are meant for external use.

## Piano API

The browser global `Piano` is the external API for controlling the component:

```js
Piano.initOctave(1, 8);
Piano.initMidi(21, 108);
Piano.initRange("A0", "C8");
Piano.clear();
```

Rules for `Piano.initOctave(startOctave, endOctave)`:

- `startOctave` must be lower than `endOctave`.
- Valid octave values are `-1..9`, matching the MIDI range.
- Invalid input should log an error to the console and paint the full piano.
- The painted MIDI range must be clamped to `0..127`; MIDI ends at `Sol9` / `G9`.

Rules for `Piano.initMidi(startMidiNote, endMidiNote)`:

- MIDI values must be integers in `0..127`.
- `startMidiNote` must be lower than `endMidiNote`.
- Invalid input should log an error and paint the full piano.

Rules for `Piano.initRange(startNoteName, endNoteName)`:

- Note names may use English (`A0`, `Bb3`, `C#4`) or Spanish (`La0`, `Sib3`, `Do#4`).
- A standard 88-key piano should use `Piano.initRange("A0", "C8")`.
- Invalid input should log an error and paint the full piano.

`Piano.init(...)` is kept as a backward-compatible alias for `Piano.initOctave(...)`.

`Piano.clear()` should remove the painted keyboard and reset active note state.

## Staff API

The browser global `Staff` controls the music staff component:

```js
Staff.initOctave(2, 5, 12, "FA");
Staff.initMidi(21, 59, "FA");
Staff.initRange("A0", "B3", "FA");
Staff.initRange("C4", "C8", "SOL");
Staff.clear();
```

Rules for `Staff.initOctave(startOctave, endOctave, lineSpacing, clef)`:

- `startOctave` must be lower than `endOctave`.
- Valid octave values are `-1..9`, matching the MIDI range.
- `lineSpacing` is optional and defaults to `10` pixels.
- `clef` is optional and defaults to `"SOL"`.
- Supported clefs are `"SOL"`, `"FA"`, and `"DO"`.
- Invalid octave input should log an error and paint the full staff.

Rules for `Staff.initMidi(startMidiNote, endMidiNote, lineSpacing, clef)`:

- MIDI values must be integers in `0..127`.
- `startMidiNote` must be lower than `endMidiNote`.
- Invalid input should log an error and paint the full staff.

Rules for `Staff.initRange(startNoteName, endNoteName, lineSpacing, clef)`:

- Note names may use English (`A0`, `Bb3`, `C#4`) or Spanish (`La0`, `Sib3`, `Do#4`).
- Recommended piano split: `Staff.initRange("A0", "B3", "FA")` and `Staff.initRange("C4", "C8", "SOL")`.
- Invalid input should log an error and paint the full staff.

`Staff.init(...)` is kept as a backward-compatible alias for `Staff.initOctave(...)`.

## Styling rules

- Prefer existing CSS conventions inside the component.
- Keep text readable and avoid clipping.
- Keep the piano layout stable: key widths, octave markers, and note labels should not shift during interaction.
- The central C key, MIDI `60`, should remain visually distinguishable unless a task says otherwise.
- Active notes should remain obvious and should override default key colors while active.

## Browser behavior

- The app is intended for normal desktop/mobile browsers.
- Mouse/touch interaction may be used.
- Keyboard or TV remote navigation is not a requirement.
- MIDI support depends on the browser; unsupported MIDI should fail gracefully with a console message.

## Testing / validation

Before considering a task complete, check the most relevant items:

- `node --check src/components/keyboard/keyboard.js`
- `node --check src/components/staff/staff.js`
- `node --check src/App.js`
- The page loads without obvious console errors.
- `Piano.initOctave(...)`, `Piano.initMidi(...)`, and `Piano.initRange(...)` paint the expected range.
- `Piano.clear()` removes the keyboard and resets note state.
- Invalid range input logs an error and paints the full piano or staff.

There is currently no package manager setup or npm build pipeline in this repository. Do not invent npm commands unless project files are added to support them.

## Commit style

Use short English commit messages.

Generate commit messages based only on staged changes using `git diff --cached`. Do not include unstaged changes in the analysis.

Examples:

- Add octave range API
- Mark middle C on keyboard
- Fix MIDI range rendering

## Output style

When proposing code changes:

- Explain the problem briefly.
- Provide the smallest useful patch.
- Mention risks or compatibility concerns.
- Prefer copy-paste-ready code when useful.
