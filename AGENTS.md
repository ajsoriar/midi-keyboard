# AGENTS.md

## Project overview

This repository contains a Smart TV application.

The project targets multiple TV platforms, including:

- HTML5 browser
- Tizen
- WebOS
- HbbTV

Performance on older devices is important. Avoid unnecessary renders, heavy parsing, large loops in render paths, and excessive memory usage.

## Main rules

- Prefer simple, explicit JavaScript.
- Do not use TypeScript.
- Keep code compatible with older browser engines when possible.
- Avoid modern syntax if it may break old WebOS/HbbTV browsers unless transpilation/polyfills are confirmed.
- Do not introduce new dependencies unless clearly justified.
- Preserve existing architecture and naming conventions.
- Keep changes minimal and focused.
- Do not reformat unrelated files.
- Add defensive checks for undefined/null values.
- Prefer readable code over clever abstractions.
- Do not edit generated output under `dist/` or packaged platform templates unless the task explicitly requires it.
- Be aware that some project commands update `.env` from `package.json`; mention that side effect when it matters.
- Never deploy or upload to `dev`, `pre`, or `prod` environments. Deployment operations must be executed manually by the developer.

## JavaScript rules

- Prefer plain JavaScript modules and functions over framework-specific patterns.
- Keep state handling simple and explicit.
- Avoid repeated DOM updates in loops; batch updates when possible.
- Avoid expensive calculations in rendering or event handlers.
- Avoid mutating shared objects directly; derive local values or clone when needed.
- Keep public interfaces backward compatible when changing function signatures.

## Smart TV / remote control rules

- Navigation is usually controlled by keyboard/remote events.
- Do not break focus management.
- Preserve support for arrow keys, OK/Enter, Back/Escape where applicable.
- Avoid relying on mouse-only behavior.
- Avoid layout changes that may affect TV navigation.

## Styling rules

- Prefer existing CSS conventions.
- Avoid unnecessary animations on low-end TV platforms.
- Keep text overflow safe.
- Avoid UI changes that may cause clipping on small or old screens.

## API / data rules

- Avoid repeated API calls for the same data.
- Reuse existing cache/memory mechanisms when available.
- Keep JSON payload handling efficient.
- Validate optional fields before use.

## Testing / validation

Before considering a task complete, check:

- The app builds successfully.
- No obvious console errors are introduced.
- Navigation still works with keyboard/remote.
- Low-end platform behavior is not made worse.
- Existing public APIs remain compatible.

## Commands

Common commands:

```bash
npm install
npm run dev-local:prod
npm run build:smarttv:hosted_webapp:dev
npm run build:hbbtv:hosted_webapp:dev
npm run lint
```

If a command fails because dependencies are missing, do not invent a workaround. Report the exact problem and suggest the minimal fix.

`npm run lint` currently scans broad repository areas, including template files, so prefer a file-scoped `npx eslint path/to/file.js` check when validating a targeted change.

Do not run deploy commands such as `npm run deploy:*`; deployments to `dev`, `pre`, and `prod` are developer-only operations.

## Commit style

Use short English commit messages.

**Important:** Generate commit messages based **only on the staged changes** using `git diff --cached`. Do not include unstaged changes in the analysis.

Use the Jira-prefixed style only when the current branch starts with an `AJSR-XXXX` ticket code. If the branch does not start with a ticket code, do not add a prefix.

If `BUILD_NUMBER` is modified, use `upgrade build number to xxx`, replacing `xxx` with the new build number.

Examples:

- AJSR-1234 Fix text overflow in settings panel
- AJSR-1234 Disable settings panel in demo mode
- AJSR-1234 Improve image fallback handling
- Fix menu ordering in home page
- Upgrade build number to 352

## Output style

When proposing code changes:

- Explain the problem briefly.
- Provide the smallest useful patch.
- Mention risks or compatibility concerns.
- Prefer copy-paste-ready code when possible.
