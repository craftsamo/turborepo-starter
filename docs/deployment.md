# Deployment

## Setting Up the Project

1. Set the required environment variables.

```text
# .env

GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_PROJECT_NUMBER=

## Set any unique value
GOOGLE_CLOUD_IDENTITY_POOL_ID=
GOOGLE_CLOUD_IDENTITY_PROVIDER_ID=
```

2. Change the `name` in [package.json](../package.json) to an appropriate value
   and update the `author` to your own account.

3. Run [Setup Script](../scripts/setup-google-cloud.sh).

> [!NOTE]
>
> If a permission error occurs, run `chmod +x ./scripts/setup-google-cloud.sh`
> to grant execution permissions to the script.

4. Set the following environment variables in Github.
   - **Environment**:
     - `GOOGLE_CLOUD_PROJECT_ID `
     - `GOOGLE_CLOUD_PROJECT_NUMBER`
     - `GOOGLE_CLOUD_IDENTITY_POOL_ID`
     - `GOOGLE_CLOUD_IDENTITY_PROVIDER_ID`
   - **Variable**:
     - `DOMAIN`
     - `GOOGLE_CLOUD_REGION`

## Deployment Workflows

### Overview

Deployment is handled via GitHub Actions workflows defined in
`.github/workflows/deployment.yml` and
`.github/workflows/deployment-common.yml`. The workflows rely on environment
variables and inputs passed during workflow dispatch.

### Workflow Inputs

The `deployment.yml` workflow requires the following inputs:

- `targets`: A comma-separated list of app names to deploy, corresponding to the
  `name` field in `apps/**/package.json`.
  - Example: `web,api`
- `environment`: The deployment environment, either `production` or
  `development`.

### Validation Logic

Inputs are validated as follows:

- `environment`:
  - Must not be empty.
  - If `production`, the branch must be `main`.
- `targets`:
  - Must match valid app names from `apps/**/package.json`.
  - Invalid separators or characters in `targets` will result in errors.

### Workflow Steps

#### `get-details` Job

This job retrieves data required for deployment, such as repository information
and app metadata.

#### `validate` Job

Validates the `environment` and `targets` inputs. Generates a matrix of valid
targets for deployment.

#### `deploy-cloudrun` Job

Deploys each app specified in the `targets` matrix to Google Cloud Run. The
deployment process includes:

1. Authenticating with Google Cloud.
2. Building and pushing Docker images to Artifact Repository.
3. Creating service declarations.
4. Deploying services to Cloud Run.

### Common Workflow (`deployment-common.yml`)

This reusable workflow handles:

- Docker image creation and Artifact Repository setup.
- Cloud Run deployment using service declarations.

## Additional Notes

- For Docker authentication, the workflow uses the `google-github-actions/auth`
  action.
- The `setup-google-cloud.sh` script must be executed before deployment to
  configure Google Cloud resources.
