# Sign-In Flow

The sign-in flow uses Clerk's email OTP (one-time password) mechanism. No passwords are stored or managed.

## Steps

### 1. Email Entry (`sign-in.tsx`)

The user enters their email address. On submit, the app calls Clerk's `signIn.create()` with `strategy: 'email_code'`. Clerk sends a 6-digit code to the provided email address.

```ts
await signIn.create({
  identifier: email,
  strategy: 'email_code',
});
```

### 2. OTP Verification (`verify-email.tsx`)

The user enters the 6-digit code. The app calls `signIn.attemptFirstFactor()`:

```ts
await signIn.attemptFirstFactor({
  strategy: 'email_code',
  code: otpValue,
});
```

On success, Clerk creates a session and stores the token via `expo-secure-store`.

### 3. Post-Auth Redirect

After a successful sign-in, the `AuthGuard` (in `app/_layout.tsx`) checks whether the user has a complete profile in Supabase:

- **Profile exists and is complete** → redirect to `/(tabs)/feed`
- **No profile** → redirect to `/(auth)/onboarding`

## Resend OTP

The verify screen provides a "Resend code" button. This calls:

```ts
await signIn.prepareFirstFactor({ strategy: 'email_code' });
```

A cooldown timer prevents spam (30 seconds between resend attempts).

## Error Handling

All Clerk errors return a `ClerkAPIError[]` array. The app maps common error codes to user-friendly messages:

| Clerk Error Code | User Message |
|---|---|
| `form_code_incorrect` | "Incorrect code. Please try again." |
| `verification_expired` | "The code has expired. Please request a new one." |
| `too_many_requests` | "Too many attempts. Please wait a moment." |
