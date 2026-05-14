# AGENTS.md

## Project Overview

This repository contains a small browser app for visualizing and interacting with a MIDI piano keyboard and music staffs.

It is not a Smart TV app. Do not apply Tizen, WebOS, HbbTV, TV remote-control, packaged TV app, or deployment assumptions unless a future task explicitly adds that target.

The app is plain HTML, CSS, and JavaScript. It uses Web Components and browser APIs. There is currently no package manager setup, framework, bundler, or npm build pipeline.

## Agent Files

Do not modify agent instruction files unless the user explicitly asks you to do so.

Agent instruction files include this file, GitHub Copilot instruction files, and any files under `.github/instructions`.

When a task requires code changes, keep agent instruction files out of the patch unless the user specifically requests updates to those files.

## Main Rules

- Prefer simple, explicit JavaScript.
- Do not use TypeScript unless the project is intentionally migrated.
- Do not introduce a framework, bundler, package manager, or npm scripts unless clearly requested.
- Do not introduce new dependencies unless clearly justified.
- Preserve the existing Web Component approach.
- Keep changes minimal and focused.
- Do not reformat unrelated files.
- Add defensive checks for undefined or null values where user input, MIDI input, or DOM lookup may fail.
- Prefer readable code over clever abstractions.
- Keep public interfaces backward compatible when possible.

## JavaScript Rules

- Use plain JavaScript modules and browser APIs.
- Keep state handling simple and explicit.
- Avoid repeated DOM updates in loops; build DOM output once and then apply a single update when practical.
- Avoid expensive calculations in rendering or MIDI event handlers.
- Keep MIDI note numbering consistent with the standard range from 0 to 127.
- Use the project convention that MIDI 60 is Do4 / C4, the central C.
- Public component controls should be exposed through the existing browser globals only when they are meant for external use.

## Piano And Staff Behavior

- The keyboard component is controlled through the browser global `Piano`.
- The staff component is controlled through the browser global `Staff`.
- The API supports octave-based, MIDI-number-based, and note-name-based initialization.
- Keep the old generic initialization method as a backward-compatible alias for octave initialization unless the user explicitly asks to remove it.
- A standard 88-key piano range is A0 through C8, equivalent to MIDI 21 through 108.
- Staff clefs supported by the app are SOL, FA, and DO.
- For a normal piano layout, prefer FA for the low range and SOL for the high range.
- Natural notes should remain visually distinct from accidentals.
- The central C key/note should remain visually distinguishable unless a task says otherwise.
- Active notes should remain obvious and should override default key colors while active.

## Styling Rules

- Prefer existing CSS conventions inside the components.
- Keep text readable and avoid clipping.
- Keep piano key widths, octave markers, staff lines, and note labels stable during interaction.
- The staff should draw exactly five black main lines.
- Optional guide lines above and below the staff should be gray.
- Avoid layout shifts caused by hover, labels, active state, or dynamic content.

## Browser Behavior

- The app is intended for normal desktop and mobile browsers.
- Mouse and touch interaction are allowed.
- Keyboard or TV remote navigation is not a requirement.
- Web MIDI API support depends on the browser; unsupported MIDI should fail gracefully with a console message.

## Testing And Validation

Before considering a task complete, run the most relevant syntax checks for changed JavaScript files.

For this repository, the usual checks are the Node syntax checks for the app entrypoint, keyboard component, and staff component.

When behavior changes, also verify the affected initialization mode, clear behavior, invalid input behavior, and obvious console errors in the browser.

Do not invent npm commands unless project files are added to support them.

## Commit Style

Use short English commit messages.

Generate commit messages based only on staged changes. Do not include unstaged changes in the analysis.

Use imperative mood and keep the first line concise.

## Output Style

When proposing code changes:

- Explain the problem briefly.
- Provide the smallest useful patch.
- Mention risks or compatibility concerns.
- Prefer concise, actionable guidance.
