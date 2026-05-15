---
applyTo: "**"
---

# Commit message instructions

Generate commit messages only from the staged Git changes.

If the current branch starts with a ticket code, use that code as the commit message prefix.

```text
AJSR-XXXX
```

Where XXXX is a number.

If the current branch does not start with a ticket code, do not add a branch or ticket prefix.

Use this format when a ticket prefix is available:

```text
AJSR-XXXX Short imperative summary
```

Use this format when no ticket prefix is available:

```text
Short imperative summary
```

If the staged changes modify `BUILD_NUMBER`, the final commit message must be:

```text
Upgrade build number to xxx
```

Replace `xxx` with the new build number from the staged diff.

Rules:

- **Analyze ONLY the staged changes** (not unstaged changes). Use `git diff --cached` if needed to verify what is staged.
- Use English.
- Use imperative mood.
- Keep the first line under 100 characters if possible.
- Do not use Conventional Commits prefixes like fix:, feat:, chore: unless explicitly requested.
- Do not invent information that is not visible in the staged diff.
- Prefer concise messages.
- Mention the main affected area when useful.
- If the staged changes affect several unrelated areas, suggest splitting the commit.
- Do not ask the user for a ticket code when the branch has no ticket prefix.

Good examples:

- AJSR-1234 Fix text overflow in settings panel
- AJSR-1234 Disable settings panel in demo mode
- Fix menu ordering in home page
- Upgrade build number to 352

Bad examples:

- AJSR-1234 fix: update stuff
- AJSR-1234 changes
- Updated files
- Improve app
