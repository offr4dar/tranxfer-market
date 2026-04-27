# Auth Guard

The `AuthGuard` component, defined in `app/_layout.tsx`, is responsible for protecting all routes in the app. It runs on every navigation event.

## Logic

```ts
// Pseudocode — see app/_layout.tsx for full implementation
function AuthGuard({ children }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <LoadingScreen />;

  if (!isSignedIn) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return children;
}
```

## Behaviours

| User State | Destination |
|---|---|
| Clerk session not yet loaded | Loading screen (no redirect) |
| No Clerk session | `/(auth)/welcome` |
| Clerk session exists, profile complete | Allow access to `/(tabs)/*` |
| Clerk session exists, no Supabase profile | `/(auth)/onboarding` |
| Signed-in user tries to access auth screens | Redirected away (back to feed) |

## `LoginOverlay`

In addition to the `AuthGuard`, tab screens render a `LoginOverlay` if the user's Supabase profile is missing or incomplete. This is a second-layer safety net — it catches edge cases where a Clerk session exists but onboarding was never completed (e.g. if the app was force-quit mid-wizard).

The overlay renders over the top of the tab content and prevents interaction with the underlying screen until the user completes onboarding or signs out.

## Token Persistence

Clerk tokens are persisted using `expo-secure-store` via a custom token cache passed to `ClerkProvider`:

```ts
const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};
```

This means the user remains signed in across app restarts until they explicitly sign out.
