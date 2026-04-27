# Local Setup

Follow these steps to get the project running on your machine.

## 1. Clone the Repository

```bash
git clone <your-repo-url>
cd tranxfer-market
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env.local
```

See [Environment Variables](environment-variables.md) for a full breakdown of each key.

## 4. Apply Database Migrations

Log into your Supabase project dashboard and run each migration in order from `supabase/migrations/`. Migrations are numbered and must be applied sequentially:

```
001_initial_schema.sql
002_agent_profiles_enhance.sql
003_scout_fields_merged.sql
004_drop_agent_age.sql
005_messages.sql
006_notifications.sql
007_select_policies.sql
008_mobile_rls_policies.sql
```

## 5. Start the Dev Server

```bash
npm start
```

## 6. Open on Device or Simulator

```bash
# iOS Simulator (macOS only)
npm run ios

# Android Emulator
npm run android

# Physical device — scan the QR code from the Expo Go app
npm start
```

> **Note:** iOS Simulator requires Xcode to be installed and a simulator configured.
