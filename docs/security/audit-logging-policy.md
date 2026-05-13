# Audit Logging Policy

## Purpose

This policy defines what Voyager logs, why logging is required, and how audit data supports accountability and security monitoring.

## Events Logged

- Authentication events, including successful and failed logins.
- Account lockouts and account unlock actions.
- Password reset OTP issuance and password reset completion or failure.

## Logged Data Elements

- User identifier when available.
- Email address associated with the action.
- Action name and functional module.
- Action details.
- IP address.
- Success or failure status.
- Suspicious-event flag when applicable.
- Timestamp in UTC.

## Retention and Review

- Audit logs should be retained according to the institution or deployment retention requirement.
- Elevated security events should be reviewed regularly by administrators.
- Audit data must be protected from unauthorized modification.

## Privacy and Security

- Audit logs must not expose passwords or OTP values.
- Access to audit log viewing should be restricted to authorized administrative roles.
- Logs should support investigations, incident response, and compliance reporting.
