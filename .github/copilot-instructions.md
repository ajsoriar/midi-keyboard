# GitHub Copilot instructions

This is a JavaScript Smart TV application for HTML5 browser, Tizen, WebOS, and HbbTV targets.

Follow these rules:

- Keep code simple, explicit, and compatible with older TV browsers.
- Avoid unnecessary dependencies.
- Avoid unnecessary reflows, repaints, and repeated DOM work.
- Preserve keyboard and remote-control navigation.
- Do not break focus behavior.
- Add null/undefined guards when reading API data.
- Avoid modern browser APIs unless compatibility is confirmed.
- Prefer existing project conventions over new patterns.
- Do not reformat unrelated code.
- Keep changes minimal and focused.
- Do not edit generated output under `dist/` or packaged platform templates unless explicitly requested.
- Never deploy or upload to `dev`, `pre`, or `prod` environments. Deployment operations must be executed manually by the developer.

Performance matters, especially on old WebOS, Tizen, and HbbTV devices.

When suggesting JavaScript code:

- Prefer plain modules and small, explicit functions.
- Avoid unnecessary state and global mutable data.
- Keep event listeners scoped and clean up when no longer needed.
- Avoid expensive calculations in render/update paths.
- Avoid mutating API objects directly; derive local values instead.
- Keep function signatures and exported APIs backward compatible.

When working on Smart TV behavior:

- Preserve arrow keys, OK/Enter, Back/Escape, and equivalent remote inputs.
- Keep focus management stable.
- Avoid mouse-only interactions.
- Avoid layout shifts that can affect focused elements.

When fixing bugs:

- Explain the cause.
- Provide the smallest safe fix.
- Mention any possible side effects.

When validating changes:

- Prefer file-scoped checks for targeted edits.
- Use the real project scripts from `package.json`.
- Do not run or suggest deploy commands such as `npm run deploy:*` unless the user explicitly asks for deployment guidance.
- Note existing unrelated lint/build warnings separately from the change being made.
