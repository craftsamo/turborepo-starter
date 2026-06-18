# Display Details Workflow

**File**: `.github/workflows/display-details.yml`

## Prerequisites

- Manual trigger via GitHub Actions UI (`workflow_dispatch`)
- Requires `get-details.yml` reusable workflow to be present

## How It Works

The workflow manually displays information about the project, applications, and
repository by calling the reusable `get-details.yml` workflow.

### Inputs

Optional input parameter:

| Parameter           | Type   | Options                                                      | Default | Description                      |
| ------------------- | ------ | ------------------------------------------------------------ | ------- | -------------------------------- |
| `github_event_name` | choice | `workflow_dispatch`, `pull_request`, `push`, `issue_comment` | (none)  | Type of GitHub event to simulate |

### Output

The workflow displays the following information in the GitHub Actions logs:

1. **Project Name** - Name from root `package.json`
2. **Apps Details** - Array of all apps with name, version, and file path
3. **App Details by Name** - Object with app name as key for easy lookup
4. **Repository Information** - Repo name, owner, and branch information
   (normalized for use in cache keys and scopes)

### Example Output

```
Project Name: turborepo-starter
Apps Details: [{"name":"web","version":"0.0.0","lowercase_version":"0-0-0","file_path":"apps/web/package.json"}]
App Details by name: {"web":{"name":"web","version":"0.0.0","lowercase_version":"0-0-0","file_path":"apps/web/package.json"}}
Repository Information: {"repo_name":"turborepo-starter","repo_name_lowercase":"turborepo-starter","repo_owner":"craftsamo","repo_owner_lowercase":"craftsamo","ref_name":"main","ref_name_lowercase":"main"}
```

### Process

1. **Trigger**: Manual workflow dispatch from GitHub Actions UI
2. **Execute**: Call `get-details.yml` reusable workflow
3. **Collect**: Gather project, apps, and repository information
4. **Display**: Print all collected information to workflow logs

## Data Collected

### Project Information

- Project name from `package.json`

### Applications Information

- App name from `apps/**/package.json`
- Version number
- Lowercase version (dots replaced with hyphens for use in cache keys)
- File path to `package.json`

### Repository Information

- Repository name (original and lowercase)
- Repository owner (original and lowercase)
- Current branch/ref name (original and normalized for cache scope usage)
