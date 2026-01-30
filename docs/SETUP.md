# Zo POS - Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

## 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Set Up the Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the SQL from `docs/database.sql`
4. Run the SQL to create the `zop-users` table

This will:

- Create the `zop-users` table
- Set up Row Level Security (RLS) policies
- Create triggers for automatic `updated_at` timestamp
- Add necessary indexes for performance

## 4. Authentication Setup

The authentication is already configured in the app:

- **Login**: `/login`
- **Register**: `/register`

### Features:

- ✅ Email/password authentication via Supabase Auth
- ✅ Automatic user profile creation in `zop-users` table
- ✅ Row Level Security (users can only access their own data)
- ✅ Auth context available throughout the app via `useAuth()` hook

## 5. Using Authentication in Your App

```tsx
import { useAuth } from "@/lib/context/AuthContext";

function YourComponent() {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return <div>Please login</div>;

  return (
    <div>
      <h1>Welcome, {profile?.first_name}!</h1>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

## 6. Database Schema

### zop-users Table

| Column      | Type        | Description                         |
| ----------- | ----------- | ----------------------------------- |
| id          | UUID        | Primary key (references auth.users) |
| email       | TEXT        | User email (unique)                 |
| first_name  | TEXT        | User first name                     |
| last_name   | TEXT        | User last name                      |
| avatar_url  | TEXT        | Profile picture URL (optional)      |
| phone       | TEXT        | Phone number (optional)             |
| preferences | JSONB       | User preferences/settings           |
| created_at  | TIMESTAMPTZ | Account creation timestamp          |
| updated_at  | TIMESTAMPTZ | Last update timestamp               |

## 7. Next Steps

After setting up authentication, you can:

1. Create protected routes
2. Add user profile editing
3. Implement password reset functionality
4. Add social authentication (Google, Facebook, etc.)
5. Create additional tables with the `zop-` prefix
