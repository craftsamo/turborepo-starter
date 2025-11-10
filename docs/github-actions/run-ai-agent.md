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

### Command Formats

The workflow recognizes the following command patterns:

- `/oc` - Shorthand command trigger
- `/opencode` - Full command trigger

Both formats can appear anywhere in the comment:

```
Comment can have text before /oc and text after
/opencode can appear at the start
Text /oc text in the middle
```

### AI Model

The workflow uses dynamic model configuration based on repository variables:

| Variable         | Default Value    | Description                       |
| ---------------- | ---------------- | --------------------------------- |
| `AI_PROVIDER_ID` | `github-copilot` | AI model provider                 |
| `AI_MODEL_ID`    | `gpt-5-mini`     | Specific model for GitHub Copilot |

**Default Model**: `github-copilot/gpt-5-mini`

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

The workflow operates with limited permissions for security:

| Permission      | Level | Purpose                         |
| --------------- | ----- | ------------------------------- |
| `id-token`      | write | OIDC token for authentication   |
| `contents`      | read  | Read repository code and files  |
| `pull-requests` | read  | Read PR details and comments    |
| `issues`        | read  | Read issue details and comments |
