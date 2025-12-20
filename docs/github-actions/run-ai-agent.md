# Run AI Agent Workflow

**File**: `.github/workflows/opencode.yml`

## Prerequisites

- Comment created on an issue or pull request containing `/oc` or `/opencode`
  command
- GitHub Copilot authentication configured (optional, for Copilot model)
- Repository must have `id-token: write`, `contents: read`,
  `pull-requests: read`, and `issues: read` permissions

## How It Works

The workflow automatically triggers when a comment with `/oc` or `/opencode`
command is posted on an issue or pull request. It uses the
[OpenCode GitHub Action](https://github.com/sst/opencode) to run AI-powered code
tasks.

### Process

1. **Trigger**: Comment created containing `/oc` or `/opencode` command
2. **Filter**: Check if comment matches command pattern
3. **Checkout**: Clone repository to access codebase
4. **Authenticate**: Set up GitHub Copilot authentication (if configured)
5. **Execute**: Run OpenCode agent with specified model
6. **Report**: Post results as comment on the issue/PR

### Available Commands

| Command                  | Description                                   | PR Conversation | PR File Review | Issue |
| ------------------------ | --------------------------------------------- | :-------------: | :------------: | :---: |
| `/oc review`             | Review the PR for code style, typos, and bugs |       ✅        |       ❌       |  ❌   |
| `/oc issue`              | Analyze issue and create implementation plan  |       ❌        |       ❌       |  ✅   |
| `/oc task <instruction>` | Execute a task with commits                   |       ✅        |       ❌       |  ✅   |

#### Command Details

**`/oc review`**

- Reviews the PR for compliance with project guidelines
- Creates review comments on specific lines
- Read-only operation (no file modifications)
- Only available in PR conversation tab
- Any arguments after `review` are ignored

**`/oc issue`**

- Analyzes issue content and creates implementation plan
- Explores codebase to understand relevant code
- Posts analysis as a comment on the issue
- Read-only operation (no file modifications)
- Only available on issues
- Any arguments after `issue` are ignored

**`/oc task <instruction>`**

- Executes the specified task and commits changes
- On PR: Commits directly to the PR branch
- On Issue: Creates a new branch and PR with `Closes #<issue_number>`

#### Usage Examples

```
/oc review
/oc issue
/oc task Add unit tests for the login function
/oc task Fix the typo in README.md
```

Both `/oc` and `/opencode` prefixes are supported.

### AI Model

The workflow uses dynamic model configuration based on repository variables:

| Variable             | Default Value       | Description                    |
| -------------------- | ------------------- | ------------------------------ |
| `AI_PROVIDER_ID`     | `github-copilot`    | AI model provider              |
| `AI_MODEL_ID`        | `gpt-5-mini`        | Default model for all commands |
| `AI_REVIEW_MODEL_ID` | `AI_MODEL_ID` value | Model for `/oc review`         |
| `AI_ISSUE_MODEL_ID`  | `AI_MODEL_ID` value | Model for `/oc issue`          |
| `AI_TASK_MODEL_ID`   | `AI_MODEL_ID` value | Model for `/oc task`           |

**Default Model**: `github-copilot/gpt-5-mini`

**Fallback Order**: Command-specific model → `AI_MODEL_ID` → `gpt-5-mini`

The model can be customized by setting repository variables in GitHub repository
settings.

### Authentication

The "Write opencode Github Copilot auth" step is **only required** when using
the `github-copilot` model:

- **Secret**: `COPILOT_AUTH`
- **Location**: `~/.local/share/opencode/auth.json` (in workflow environment)
- **Content**: Full contents of Copilot auth configuration
- **Conditional**: Only runs when `COPILOT_AUTH` secret is not empty

To use GitHub Copilot model, store the auth configuration in the `COPILOT_AUTH`
repository secret. This should contain the entire contents of
`~/.local/share/opencode/auth.json` from your local OpenCode setup.

If using other models, this step is skipped and the workflow runs without GitHub
Copilot authentication.

### Permissions

The workflow operates with different permissions based on the command:

**Base Permissions:**

| Permission      | Level | Purpose                               |
| --------------- | ----- | ------------------------------------- |
| `id-token`      | write | OIDC token for authentication         |
| `contents`      | read  | Read repository code and files        |
| `pull-requests` | write | Read/write PR details and comments    |
| `issues`        | write | Read/write issue details and comments |

**Command-specific Restrictions:**

| Command      | File Edit | File Write | Bash Commands            |
| ------------ | :-------: | :--------: | ------------------------ |
| `/oc review` |    ❌     |     ❌     | `gh api*`, `gh pr diff*` |
| `/oc issue`  |    ❌     |     ❌     | `gh api*`                |
| `/oc task`   |    ✅     |     ✅     | `gh*`, `git*`            |
