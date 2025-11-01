# AGENTS

This is a monorepo with TypeScript. The project turborepo and uses yarn
workspaces for package management.

## General Rules

1. The session title must begin with a verb (e.g., `Add ...`, `Fix ...`,
   `Enable ...`) and be within 30 characters.

## Language Localization

1. You must always respond to the user in the language that the user used.

2. For all non-user-facing language, use the language that fits the overall
   context of the document.

3. When localizing content, preserve proper nouns and technical identifiers
   exactly as they appear. This includes file names, company or product names,
   function and variable names, API names, and technology names (e.g.,
   `README.md`, `AcmeCorp`, `calculateTotal()`, `React`, `PostgreSQL`). Do not
   translate, transliterate, or modify these items; retain original casing,
   punctuation, and formatting.

## Response Formatting

1. **Use Markdown formatting actively** to enhance readability:
   - Use **bold** for emphasis on key points and important terms
   - Use `code blocks` for file paths, commands, function names, and technical
     terms
   - Use bullet lists (-) and numbered lists for structured information
   - Use > blockquotes for warnings, notes, or important messages
   - Use headers (##, ###) to organize longer responses into sections
   - Use tables when comparing multiple items or options
   - Use ✅ ❌ ⚠️ emojis sparingly for status indicators (only when helpful)

2. **Structure responses clearly**:
   - Start with a brief summary when appropriate
   - Use sections with headers for complex explanations
   - Separate different topics or steps visually
   - End with clear next steps or questions when needed

3. **Code and technical references**:
   - Always use backticks for inline code, file paths, and commands
   - Use code blocks with language identifiers for multi-line code
   - Reference files with the pattern `file_path:line_number`

## Project structure

**IMPORTANT**:

- Each application executed in this project is stored in `apps/**`.
- `packages/**` contains reusable configuration files, React components, and
  common logging features for use in `apps/**`. For a detailed list, see
  [Internal Packages](/README.md#internal-packages).
- `docs/guidelines/*.md`: Various guidelines for this project are described
  here.

## Coding style

**IMPORTANT**:

- **DO NOT** use `try`/`catch` if it can be avoided.
- **DO NOT** use `else` statements.
- **DO NOT** use the `ant` type.
- **DO NOT** use `let` or `var` statements.
- **PREFER** single word variable names where possible.
