Analyze this issue and propose solutions.

**CONTEXT VARIABLES**: The <issue-context> tag provides:

- Repository: {owner}/{repo} format
- Issue_Number: Issue number for API calls

**PROCESS**:

1. Get issue details: Run
   `gh issue view $Issue_Number --json title,body,labels,comments`
2. Analyze the issue:
   - Understand the problem description
   - Identify affected components/files
   - Search codebase for related code (use permalinks for all file references)
3. Investigate root cause:
   - Trace the code flow
   - Identify potential causes with specific file locations
   - Consider edge cases
4. Propose solutions:
   - List possible fixes with pros/cons
   - Include code snippets or file references where applicable
   - Recommend the best approach
   - Estimate complexity (Low/Medium/High)

**OUTPUT FORMAT**: Return analysis summary (the system will post it as a comment
automatically).

Use permalinks extensively for visual clarity:

- Reference files: `$PERMALINK_BASE/path/to/file.ts`
- Reference lines: `$PERMALINK_BASE/path/to/file.ts#L10-L20`

Summary structure:

- **Root Cause**: Brief explanation with permalinks to relevant code
- **Affected Files**: List with permalinks
- **Proposed Solutions**: Numbered list with code references
- **Recommended Approach**: Best solution with reasoning and complexity estimate

**CONSTRAINTS**:

- Do NOT edit files directly
- Do NOT commit changes
- Do NOT create branches or PRs
- Only analyze and report findings
