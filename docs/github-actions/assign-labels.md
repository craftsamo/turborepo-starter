# Assign Labels Workflow

**File**: `.github/workflows/assign-labels.yml`

## Prerequisites

- Pull request must be **opened** (not updated/reopened)
- Branch must follow naming convention: `{type}/{description}`
- Supported branch types: `feat`, `enhance`, `improve`, `refactor`, `docs`,
  `fix`, `hotfix`
- Corresponding labels must exist in the repository

## How It Works

The workflow automatically assigns labels to pull requests based on the branch
type (first segment before `/`):

| Branch Type | Label           |
| ----------- | --------------- |
| `feat/`     | 🌱feature       |
| `enhance/`  | ⚒️enhancement   |
| `improve/`  | ⚒️enhancement   |
| `refactor/` | ⚒️enhancement   |
| `docs/`     | 📝documentation |
| `fix/`      | 🐛bug           |
| `hotfix/`   | 🐞hotfix        |

### Process

1. **Trigger**: PR is opened
2. **Extract**: Get branch type by splitting branch name at first `/`
3. **Match**: Find corresponding label based on branch type
4. **Apply**: Add label to PR (if match found)

### Example

```
Branch: feat/add-dark-mode
→ Branch type: feat
→ Label: 🌱feature
→ Result: Label automatically applied to PR
```

If the branch type doesn't match any supported type, no label is applied.
