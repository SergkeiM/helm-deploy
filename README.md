# Helm Action

Deploys a helm chart using GitHub actions.

## Parameters

### Inputs

Required and Optional Inputs.

- `release`: Helm release name. (required)
- `namespace`: Kubernetes namespace name. (required)
- `chart`: Helm chart path. (required)
- `values`: Value files to apply to the helm chart. Expects a JSON encoded array or a string.
- `task`: Task name. If the task is "remove" it will remove the configured helm release.
- `dry-run`: Helm dry-run option.
- `secrets`: Secret variables to include in value file interpolation. Expects a JSON encoded map.
- `vars`: Variables to include in value file interpolation. Expects a JSON encoded map.
- `version`: Version of the app, usually commit sha works here.
- `chart-version`: The version of the helm chart you want to deploy (distinct from app version)
- `timeout`: A [Go duration](https://pkg.go.dev/time#ParseDuration) value to wait for Kubernetes commands to complete. This defaults to 5m0s.
- `atomic`: If true, upgrade process rolls back changes made in case of failed upgrade. Defaults to true.

### Environment

- `KUBECONFIG_FILE`: Kubeconfig file for Kubernetes cluster access. (required)

### Value file interpolation

The following syntax allows variables to be used in value files:

- `${{ secrets.KEY }}`: References secret variables passed in the secrets input action.
- `${{ vars.KEY }}`: References var variables passed in the vars input action.

### Environment variable substitution

Automatically substituting environment variables in values files. (Uses [envsub](https://github.com/danday74/envsub#envsub---syntax-flag--envsub---syntax-handlebars-templatefile-outputfile)) `dollar-curly` syntax

- `${MY_VAR}`: References env variable passed in env.
- `${MY_VAR:-default}`: References env variable passed in env, if not set uses default value.

## Example

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: ["master"]

jobs:
  deployment:
    runs-on: 'ubuntu-latest'
    steps:
    - uses: actions/checkout@v3

    - name: 'Deploy'
      uses: 'froxz/helm-deploy@v1'
      with:
        release: 'nginx'
        namespace: 'default'
        chart: 'app'
        values: >-
        [
          "values.yaml", 
          "values.production.yaml"
        ]
      env:
        KUBECONFIG_FILE: '${{ secrets.KUBECONFIG }}'
```

## Example pr cleanup

If you are creating an environment per pull request with Helm you may have the
issue where pull request environments like `pr123` sit around in your cluster.
By using GitHub actions we can clean those up by listening for pull request
close events.

```yaml
# .github/workflows/pr-cleanup.yml
name: PRCleanup
on:
  pull_request:
    types: [closed]

jobs:
  deployment:
    runs-on: 'ubuntu-latest'
    steps:
    - name: 'Deploy'
      uses: 'froxz/helm-deploy@v1'
      with:
        # Task remove means to remove the helm release.
        task: 'remove'
        release: 'review-myapp-${{ github.event.pull_request.number }}'
        version: '${{ github.sha }}'
        chart: 'app'
        namespace: 'example-helm'
      env:
        KUBECONFIG_FILE: '${{ secrets.KUBECONFIG }}'
```
