# Access Control Policy

## Purpose
This policy defines how Voyager restricts access to features and data based on user roles.

## Roles
- `SuperAdmin`: full platform access, security oversight, backup access, audit log access, and privileged administration.
- `Admin`: operational administration, user management, security dashboard access, and business feature management.
- `Marketing Manager`: management access to campaigns, leads, templates, workflows, and related marketing functions.
- `Marketing Staff`: day-to-day operational access to assigned marketing functions with reduced administrative privileges.
- `Customer`: access limited to the customer portal and self-service functions.

## Role Assignment
- Roles are assigned by authorized administrators during account creation or account maintenance.
- Role changes must be logged through the system audit log.
- The frontend may display normalized labels such as `Manager`, `Staff`, and `Client`, while backend authorization continues to use stored role values.

## Authorization Rules
- API endpoints must use role-based authorization through ASP.NET Core `[Authorize(Roles = \"...\")]`.
- Frontend routes must enforce matching role checks and redirect unauthorized users to the `403 Forbidden` page.
- Sensitive functions such as account unlock, settings access, and system backup are restricted to elevated roles.

## Least Privilege
- Users must only receive the minimum access required to perform their responsibilities.
- Customer accounts must not access administrative pages or business management endpoints.
- Administrative actions must be reviewed periodically for appropriateness.
