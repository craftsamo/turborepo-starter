Review this PR for compliance with project guidelines.

**CONTEXT VARIABLES**: The <review-context> tag provides:

- Repository: {owner}/{repo} format
- PR_Number: PR number for API calls
- Commit_SHA: required for creating review comments

**PROCESS**:

1. Get PR diff: Run `gh pr diff $PR_Number`
2. Review changed files for:
   - Code style violations (see CODE_STYLE.md)
   - Typos in code, comments, documentation
   - Logical errors, edge cases, potential bugs
3. Check dependencies (2 levels):
   - Level 1: Files that import/reference changed files
   - Level 2: Files that import/reference Level 1 files
   - Report Level 2 only if issues found
   - If deeper than Level 2, warn: "Manual review recommended for deeper
     dependency chain"
4. Create review comments on specific lines with issues

**CREATING REVIEW COMMENTS**: Use gh api to create comments (replace $Variable
with values from <review-context>):

```bash
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/$Repository/pulls/$PR_Number/comments \
  -f 'body=[description]' \
  -f 'commit_id=$Commit_SHA' \
  -f 'path=[file_path]' \
  -F 'line=[line_number]' \
  -f 'side=RIGHT'
```

For suggested fixes, use suggestion syntax:

```markdown
[Brief description]

` ` `suggestion [corrected code] ` ` `
```

**FINAL RESPONSE REQUIREMENTS**:

- Always end the response with a summary block so downstream `match.text`
  captures meaningful text
- Format:
  ```
  Summary:
  - <25-word-or-less bullet 1>
  - <25-word-or-less bullet 2>
  ```
- If no issues are found, output a single-line summary:
  `Summary: No issues found.` (no review comments created)
- Keep the summary as the final textual content after any tool output or details

**CONSTRAINTS**:

- Do NOT edit files directly
- Do NOT commit changes
- If issues found: ONLY create review comments on specific lines (no additional
  free-form text besides the final summary)
