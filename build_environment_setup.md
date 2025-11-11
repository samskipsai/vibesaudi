# Build Environment Setup Guide

## Secure Docker Credential Storage

This guide explains how to configure Docker credential helpers on a Linux system to securely store Docker login credentials, eliminating the security warning about unencrypted credentials.

## Overview

By default, Docker stores credentials in plain text in `~/.docker/config.json`. This is a security risk, especially in CI/CD environments. Docker credential helpers allow you to store credentials securely using system keyrings or other secure storage mechanisms.

## Prerequisites

- Linux system (Ubuntu/Debian recommended)
- Docker installed and configured
- Root or sudo access (for system-wide installation)

## Step-by-Step Setup

### Option 1: Using Docker Credential Helper (Recommended)

#### Step 1: Install Docker Credential Helper

For Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install -y docker-credential-helper
```

For other distributions, check your package manager or install from source:
```bash
# Download the latest release
curl -L https://github.com/docker/docker-credential-helpers/releases/download/v0.8.0/docker-credential-secretservice-v0.8.0-amd64.tar.gz | tar -xz
sudo mv docker-credential-secretservice /usr/local/bin/
sudo chmod +x /usr/local/bin/docker-credential-secretservice
```

#### Step 2: Configure Docker to Use the Credential Helper

Edit or create `~/.docker/config.json`:

```bash
mkdir -p ~/.docker
cat > ~/.docker/config.json << EOF
{
  "auths": {},
  "credHelpers": {
    "registry.cloudflare.com": "secretservice"
  }
}
EOF
```

For system-wide configuration (recommended for CI/CD):
```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/config.json << EOF
{
  "auths": {},
  "credHelpers": {
    "registry.cloudflare.com": "secretservice"
  }
}
EOF
```

#### Step 3: Login to Docker Registry

After configuration, login normally:
```bash
docker login registry.cloudflare.com
```

The credentials will now be stored securely using the system keyring instead of plain text.

### Option 2: Using Pass (Password Store)

#### Step 1: Install Pass

```bash
sudo apt-get install -y pass docker-credential-helpers
```

#### Step 2: Initialize GPG Key (if not already done)

```bash
gpg --generate-key
# Follow the prompts to create a GPG key
```

#### Step 3: Initialize Pass

```bash
pass init <your-email@example.com>
```

#### Step 4: Install Docker Credential Helper for Pass

```bash
# Download docker-credential-pass
curl -L https://github.com/docker/docker-credential-helpers/releases/download/v0.8.0/docker-credential-pass-v0.8.0-amd64.tar.gz | tar -xz
sudo mv docker-credential-pass /usr/local/bin/
sudo chmod +x /usr/local/bin/docker-credential-pass
```

#### Step 5: Configure Docker

```bash
cat > ~/.docker/config.json << EOF
{
  "auths": {},
  "credHelpers": {
    "registry.cloudflare.com": "pass"
  }
}
EOF
```

### Option 3: Using Environment Variables (CI/CD)

For CI/CD environments, you can use environment variables instead of credential helpers:

```bash
# Set Docker credentials as environment variables
export DOCKER_USERNAME="your-username"
export DOCKER_PASSWORD="your-password"

# Login using environment variables
echo "$DOCKER_PASSWORD" | docker login registry.cloudflare.com -u "$DOCKER_USERNAME" --password-stdin
```

**Note:** Ensure these environment variables are stored securely in your CI/CD system's secret management (e.g., GitHub Secrets, GitLab CI Variables, etc.).

## Verification

After setup, verify that credentials are stored securely:

1. Check that `~/.docker/config.json` no longer contains plain text credentials:
   ```bash
   cat ~/.docker/config.json
   ```
   You should see `"credHelpers"` instead of `"auths"` with base64-encoded credentials.

2. Test Docker login:
   ```bash
   docker login registry.cloudflare.com
   ```
   If already logged in, you should see a success message without being prompted.

3. Verify credential helper is working:
   ```bash
   docker-credential-secretservice list
   # or
   docker-credential-pass list
   ```

## CI/CD Integration

### GitHub Actions

Add to your workflow file:
```yaml
- name: Configure Docker credentials
  run: |
    mkdir -p ~/.docker
    echo '{"auths":{},"credHelpers":{"registry.cloudflare.com":"secretservice"}}' > ~/.docker/config.json

- name: Login to Docker Registry
  run: |
    echo "${{ secrets.DOCKER_PASSWORD }}" | docker login registry.cloudflare.com -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
```

### GitLab CI

Add to your `.gitlab-ci.yml`:
```yaml
before_script:
  - mkdir -p ~/.docker
  - echo '{"auths":{},"credHelpers":{"registry.cloudflare.com":"secretservice"}}' > ~/.docker/config.json
  - echo "$CI_REGISTRY_PASSWORD" | docker login $CI_REGISTRY -u $CI_REGISTRY_USER --password-stdin
```

## Troubleshooting

### Issue: Credential helper not found

**Solution:** Ensure the credential helper binary is in your PATH:
```bash
which docker-credential-secretservice
# If not found, add to PATH or use full path
export PATH=$PATH:/usr/local/bin
```

### Issue: Permission denied

**Solution:** Ensure the credential helper has execute permissions:
```bash
chmod +x /usr/local/bin/docker-credential-secretservice
```

### Issue: Keyring not accessible

**Solution:** For headless systems (CI/CD), you may need to use environment variables or a different credential helper:
```bash
# Use pass or file-based storage for headless systems
export DOCKER_CREDENTIAL_HELPER="pass"
```

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use credential helpers** in all environments (development, staging, production)
3. **Rotate credentials regularly** (every 90 days recommended)
4. **Use least-privilege access** - only grant necessary permissions
5. **Monitor credential usage** through audit logs
6. **Use separate credentials** for different environments

## Additional Resources

- [Docker Credential Helpers Documentation](https://docs.docker.com/engine/reference/commandline/login/#credential-helpers)
- [Docker Credential Helpers GitHub](https://github.com/docker/docker-credential-helpers)
- [Cloudflare Container Registry Documentation](https://developers.cloudflare.com/workers/configuration/containers/container-registry/)

## Support

If you encounter issues with credential storage setup, please:
1. Check the troubleshooting section above
2. Review Docker and credential helper logs
3. Consult your system administrator for keyring access issues
4. Refer to the official Docker documentation

