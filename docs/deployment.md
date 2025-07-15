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

4. Set the following environment variables in Github.
   - **Environment**:
     - `GOOGLE_CLOUD_PROJECT_ID `
     - `GOOGLE_CLOUD_PROJECT_NUMBER`
     - `GOOGLE_CLOUD_IDENTITY_POOL_ID`
     - `GOOGLE_CLOUD_IDENTITY_PROVIDER_ID`
   - **Variable**:
     - `DOMAIN`
     - `GOOGLE_CLOUD_REGION`
