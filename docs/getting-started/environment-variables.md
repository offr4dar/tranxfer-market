# Environment Variables

All environment variables are prefixed with `EXPO_PUBLIC_` so they are bundled into the Expo app at build time and accessible on the client side.

> **Important:** Never commit `.env.local` to version control. It is already listed in `.gitignore`.

## Required Variables

| Variable | Description | Where to Find |
|---|---|---|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key for authentication | Clerk Dashboard → API Keys |
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project's REST URL | Supabase Dashboard → Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase Dashboard → Settings → API |

## Example `.env.local`

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Security Notes

- The anon key is safe to expose publicly — it is limited by Supabase Row-Level Security (RLS) policies.
- The Clerk publishable key is also public-safe — it only identifies your Clerk app, it does not grant any admin access.
- **Never** use your Supabase service role key or Clerk secret key in the client app.
