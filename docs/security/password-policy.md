# Password Policy

## Purpose
This policy defines the password requirements for Voyager user accounts to reduce the risk of unauthorized access.

## Scope
This policy applies to all Voyager accounts, including `SuperAdmin`, `Admin`, `Marketing Manager`, `Marketing Staff`, and `Customer`.

## Requirements
- Minimum password length is 12 characters.
- Passwords must contain at least one uppercase letter.
- Passwords must contain at least one numeric digit.
- Passwords are stored as secure hashes through ASP.NET Core Identity and are never stored in plain text.
- Password reset is performed through a one-time password (OTP) sent to the registered email address.

## Account Protection
- Login requests require reCAPTCHA verification.
- Accounts are locked after 5 failed login attempts.
- Locked accounts must be reviewed and manually unlocked by authorized administrators based on the configured security workflow.

## User Responsibilities
- Users must not share passwords with other users.
- Users must choose passwords that are not easily guessable.
- Users should change passwords immediately if compromise is suspected.

## Administrative Responsibilities
- Administrators must never request user passwords directly.
- Password reset support must follow the OTP-based reset process.
- Security events related to failed logins and resets must be retained in the audit log.
