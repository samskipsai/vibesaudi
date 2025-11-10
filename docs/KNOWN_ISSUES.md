# Known Issues

## Alarm Errors in UserAppSandboxService

**Status:** External Library Issue (Non-Critical)

**Description:**
The `UserAppSandboxService` Durable Object (from `@cloudflare/sandbox` library) is experiencing alarm handler failures. These alarms appear to be scheduled cleanup tasks that are failing.

**Evidence:**
- Multiple alarm errors in Cloudflare logs with timestamps
- Entrypoint: `UserAppSandboxService`
- Event type: `alarm`
- Error message: Timestamp strings (e.g., "2025-11-10T08:53:10.793Z")

**Root Cause:**
The `UserAppSandboxService` is a third-party Durable Object from the `@cloudflare/sandbox` package. We do not have direct control over its alarm handler implementation.

**Impact:**
- **Low**: These errors do not appear to break core functionality
- Container cleanup tasks may be failing silently
- No user-facing impact observed

**Investigation:**
- Searched codebase for alarm scheduling: **None found**
- Our code does not schedule alarms on `UserAppSandboxService`
- Alarms are internal to the `@cloudflare/sandbox` library

**Potential Solutions:**
1. **Monitor**: Continue monitoring alarm errors for patterns
2. **Update Library**: Check for updates to `@cloudflare/sandbox` that may fix alarm handlers
3. **Contact Support**: If alarms become critical, contact Cloudflare support about the Sandbox library
4. **Workaround**: None required at this time - functionality is not impacted

**Last Updated:** 2025-01-10

