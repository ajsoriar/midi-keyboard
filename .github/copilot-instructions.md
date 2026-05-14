# GitHub Copilot instructions

This is a small JavaScript browser app for visualizing and interacting with a MIDI piano keyboard.

It is not a Smart TV app. Do not apply Tizen, WebOS, HbbTV, TV remote-control, packaged TV app, or deployment assumptions.

Project structure:

- `src/index.html` loads the app.
- `src/app.css` contains page-level styles.
- `src/components/keyboard/keyboard.js` defines the `<midi-keyboard>` web component and the global `Piano` API.

Follow these rules:

- Keep code simple, explicit, and dependency-free unless a dependency is clearly requested.
- Use plain JavaScript, HTML, and CSS.
- Do not introduce TypeScript, frameworks, bundlers, or npm scripts unless the project is intentionally migrated.
- Preserve the existing custom element approach.
- Keep changes minimal and focused.
- Do not reformat unrelated code.
- Add null/undefined guards when reading MIDI input, user input, or DOM elements.
- Avoid unnecessary reflows, repaints, and repeated DOM work.
- Prefer building DOM output once and then applying a single update.
- Keep public APIs backward compatible.

MIDI and piano rules:

- MIDI note numbers must stay within the standard range `0..127`.
- The app uses the convention MIDI `60` equals `Do4` / `C4`, the central C.
- The full MIDI range starts at `Do-1` / `C-1` and ends at `Sol9` / `G9`.
- The central C key should remain visually distinguishable unless a task says otherwise.
- Active notes should remain visually obvious and override default key colors while active.

The browser global `Piano` is the external control API:

```js
Piano.initOctave(1, 8);
Piano.initMidi(21, 108);
Piano.initRange("A0", "C8");
Piano.clear();
```

Rules for `Piano.initOctave(startOctave, endOctave)`:

- `startOctave` must be lower than `endOctave`.
- Valid octave values are `-1..9`.
- Invalid input should log an error to the console and paint the full piano.
- Clamp painted notes to MIDI `0..127`.

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
- Valid octave values are `-1..9`.
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

Browser behavior:

- This app targets normal desktop/mobile browsers.
- Mouse/touch interaction is allowed.
- Keyboard or TV remote navigation is not a requirement.
- Web MIDI API support depends on the browser; unsupported MIDI should fail gracefully with a console message.

When validating changes:

- Prefer `node --check src/components/keyboard/keyboard.js` for JavaScript syntax checks.
- Also run `node --check src/components/staff/staff.js` when the staff component changes.
- Also run `node --check src/App.js` when the app entrypoint changes.
- Check that the page can load without obvious console errors when relevant.
- Check the relevant `initOctave(...)`, `initMidi(...)`, `initRange(...)`, and `clear()` behavior when those areas change.
- There is currently no package manager setup or npm build pipeline. Do not invent npm commands unless project files are added to support them.

When fixing bugs:

- Explain the cause.
- Provide the smallest safe fix.
- Mention any possible side effects.
