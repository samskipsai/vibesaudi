# Build Environment Setup Guide

This guide provides step-by-step instructions for configuring a secure build environment, including Docker credential management for CI/CD pipelines.

## Docker Credential Helper Configuration

Storing Docker credentials in plain text is a security risk. This guide explains how to use Docker's credential helper to securely store login credentials on Linux-based systems.

### Prerequisites

- Docker installed on your system
- Access to the Docker registry you need to authenticate with
- Root or sudo access (for system-wide configuration)

### Step 1: Install Docker Credential Helper

The Docker credential helper stores credentials securely using your system's keyring or a secure file.

#### Option A: Using Docker Credential Helper (Recommended)

1. **Download the credential helper binary:**

   ```bash
   # For Linux (amd64)
   curl -L https://github.com/docker/docker-credential-helpers/releases/download/v0.8.0/docker-credential-secretservice-v0.8.0.linux-amd64 -o docker-credential-secretservice
   
   # Make it executable
   chmod +x docker-credential-secretservice
   
   # Move to a directory in your PATH (e.g., /usr/local/bin)
   sudo mv docker-credential-secretservice /usr/local/bin/
   ```

2. **Verify installation:**

   ```bash
   docker-credential-secretservice version
   ```

#### Option B: Using pass (Password Store)

If you prefer using `pass` (the standard unix password manager):

1. **Install pass:**

   ```bash
   # Ubuntu/Debian
   sudo apt-get update && sudo apt-get install -y pass
   
   # CentOS/RHEL
   sudo yum install -y pass
   ```

2. **Initialize pass (if not already done):**

   ```bash
   gpg --generate-key  # If you don't have a GPG key
   pass init "your-email@example.com"
   ```

3. **Install docker-credential-pass:**

   ```bash
   curl -L https://github.com/docker/docker-credential-helpers/releases/download/v0.8.0/docker-credential-pass-v0.8.0.linux-amd64 -o docker-credential-pass
   chmod +x docker-credential-pass
   sudo mv docker-credential-pass /usr/local/bin/
   ```

### Step 2: Configure Docker to Use Credential Helper

1. **Create or edit Docker configuration file:**

   ```bash
   mkdir -p ~/.docker
   nano ~/.docker/config.json
   ```

2. **Add credential helper configuration:**

   For secretservice (Option A):
   ```json
   {
     "credsStore": "secretservice"
   }
   ```

   For pass (Option B):
   ```json
   {
     "credsStore": "pass"
   }
   ```

   **Note:** For system-wide configuration (affecting all users), edit `/etc/docker/config.json` instead.

### Step 3: Login to Docker Registry

1. **Login using standard Docker login command:**

   ```bash
   docker login <registry-url>
   ```

   Example:
   ```bash
   docker login registry.cloudflare.com
   docker login docker.io
   ```

2. **Enter your credentials when prompted:**
   - Username
   - Password or access token

3. **Verify credentials are stored:**

   ```bash
   # Check that credentials are stored (should not show plain text)
   cat ~/.docker/config.json
   ```

   The file should only contain:
   ```json
   {
     "credsStore": "secretservice"
   }
   ```

   Your actual credentials will be stored securely in the system keyring, not in this file.

### Step 4: Verify Secure Storage

1. **Test that credentials work:**

   ```bash
   docker pull <private-image>
   ```

2. **Verify credentials are not in plain text:**

   ```bash
   # This should NOT show your password
   cat ~/.docker/config.json
   
   # Check keyring (for secretservice)
   secret-tool search docker-credential
   ```

### Step 5: CI/CD Configuration

For CI/CD environments, you have several options:

#### Option A: Use Environment Variables (Temporary)

For CI/CD pipelines, you can use environment variables that are only available during the build:

```bash
# In your CI/CD pipeline configuration
export DOCKER_USERNAME="your-username"
export DOCKER_PASSWORD="your-password-or-token"

# Login using environment variables
echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USERNAME" --password-stdin <registry-url>
```

**Security Note:** Ensure your CI/CD platform securely stores these as secrets/environment variables, not in plain text in your repository.

#### Option B: Use CI/CD Secret Management

Most CI/CD platforms provide secure secret management:

**GitHub Actions:**
```yaml
- name: Login to Docker Registry
  uses: docker/login-action@v3
  with:
    registry: registry.cloudflare.com
    username: ${{ secrets.DOCKER_USERNAME }}
    password: ${{ secrets.DOCKER_PASSWORD }}
```

**GitLab CI:**
```yaml
before_script:
  - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
```

**Cloudflare Pages/Workers:**
Use Wrangler secrets:
```bash
wrangler secret put DOCKER_USERNAME
wrangler secret put DOCKER_PASSWORD
```

### Step 6: Remove Plain Text Credentials

If you previously stored credentials in plain text:

1. **Remove old credential files:**

   ```bash
   # Remove old auth config (if exists)
   rm ~/.docker/config.json
   
   # Or edit and remove the "auths" section
   nano ~/.docker/config.json
   ```

2. **Re-login to regenerate secure storage:**

   ```bash
   docker login <registry-url>
   ```

### Troubleshooting

#### Issue: Credential helper not found

**Solution:**
```bash
# Verify the binary is in PATH
which docker-credential-secretservice

# Add to PATH if needed
export PATH=$PATH:/usr/local/bin
```

#### Issue: Permission denied

**Solution:**
```bash
# Ensure binary is executable
chmod +x /usr/local/bin/docker-credential-secretservice

# Check file ownership
ls -l /usr/local/bin/docker-credential-secretservice
```

#### Issue: Keyring not accessible

**Solution:**
```bash
# For secretservice, ensure DBus is running
sudo systemctl start dbus

# For pass, ensure GPG agent is running
gpg-agent --daemon
```

#### Issue: CI/CD pipeline can't access credentials

**Solution:**
- Use environment variables or CI/CD secret management instead of credential helpers
- Credential helpers require interactive keyring access, which may not be available in CI/CD environments

### Security Best Practices

1. **Never commit credentials to version control:**
   - Add `~/.docker/config.json` to `.gitignore` if it contains plain text
   - Use credential helpers or CI/CD secrets instead

2. **Use access tokens instead of passwords:**
   - Generate registry-specific access tokens
   - Tokens can be scoped and revoked easily

3. **Rotate credentials regularly:**
   ```bash
   # Remove old credentials
   docker logout <registry-url>
   
   # Login with new credentials
   docker login <registry-url>
   ```

4. **Use least privilege:**
   - Create tokens with minimal required permissions
   - Use different tokens for different environments (dev, staging, prod)

5. **Monitor credential usage:**
   - Review registry access logs regularly
   - Set up alerts for unusual access patterns

### Additional Resources

- [Docker Credential Helpers Documentation](https://docs.docker.com/engine/reference/commandline/login/#credential-helpers)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)

### Summary

By following this guide, you will:
- ✅ Store Docker credentials securely using system keyring
- ✅ Avoid plain text credential storage
- ✅ Configure CI/CD pipelines with secure credential management
- ✅ Follow security best practices for credential handling

If you encounter any issues, refer to the troubleshooting section or consult the official Docker documentation.
