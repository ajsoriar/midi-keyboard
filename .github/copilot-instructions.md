# GitHub Copilot Instructions

This repository contains a small browser app for visualizing and interacting with a MIDI piano keyboard and music staffs.

It is not a Smart TV app. Do not apply Tizen, WebOS, HbbTV, TV remote-control, packaged TV app, or deployment assumptions unless a future task explicitly adds that target.

The app is plain HTML, CSS, and JavaScript. It uses Web Components and browser APIs. There is currently no package manager setup, framework, bundler, or npm build pipeline.

## Agent Files

Do not modify agent instruction files unless the user explicitly asks you to do so.

Agent instruction files include AGENTS.md, GitHub Copilot instruction files, and any files under `.github/instructions`.

When a task requires code changes, keep agent instruction files out of the patch unless the user specifically requests updates to those files.

## Main Rules

- Keep code simple, explicit, and dependency-free unless a dependency is clearly requested.
- Use plain JavaScript, HTML, and CSS.
- Do not introduce TypeScript, frameworks, bundlers, package managers, or npm scripts unless the project is intentionally migrated.
- Preserve the existing Web Component approach.
- Keep changes minimal and focused.
- Do not reformat unrelated code.
- Add null or undefined guards when reading MIDI input, user input, or DOM elements.
- Avoid unnecessary reflows, repaints, and repeated DOM work.
- Prefer building DOM output once and then applying a single update.
- Keep public APIs backward compatible when possible.

## MIDI And Music Rules

- MIDI note numbers must stay within the standard range from 0 to 127.
- The app uses the convention MIDI 60 equals Do4 / C4, the central C.
- The full MIDI range starts at Do-1 / C-1 and ends at Sol9 / G9.
- A standard 88-key piano range is A0 through C8, equivalent to MIDI 21 through 108.
- The keyboard component is controlled through the browser global `Piano`.
- The staff component is controlled through the browser global `Staff`.
- The API supports octave-based, MIDI-number-based, and note-name-based initialization.
- Keep the old generic initialization method as a backward-compatible alias for octave initialization unless the user explicitly asks to remove it.
- Staff clefs supported by the app are SOL, FA, and DO.
- For a normal piano layout, prefer FA for the low range and SOL for the high range.
- Natural notes should remain visually distinct from accidentals.
- The central C key/note should remain visually distinguishable unless a task says otherwise.
- Active notes should remain visually obvious and override default key colors while active.

## Styling Rules

- Prefer existing CSS conventions inside the components.
- Keep text readable and avoid clipping.
- Keep piano key widths, octave markers, staff lines, and note labels stable during interaction.
- The staff should draw exactly five black main lines.
- Optional guide lines above and below the staff should be gray.
- Avoid layout shifts caused by hover, labels, active state, or dynamic content.

## Browser Behavior

- This app targets normal desktop and mobile browsers.
- Mouse and touch interaction are allowed.
- Keyboard or TV remote navigation is not a requirement.
- Web MIDI API support depends on the browser; unsupported MIDI should fail gracefully with a console message.

## Validation

Before considering a task complete, run the most relevant syntax checks for changed JavaScript files.

For this repository, the usual checks are the Node syntax checks for the app entrypoint, keyboard component, and staff component.

When behavior changes, also verify the affected initialization mode, clear behavior, invalid input behavior, and obvious console errors in the browser.

Do not invent npm commands unless project files are added to support them.

## Fixing Bugs

- Explain the cause.
- Provide the smallest safe fix.
- Mention possible side effects when relevant.
