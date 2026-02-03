# User Management & Analytics - Setup Instructions

## Changes Made

### 1. Fixed Auto-Login Issue When Creating Users

**Problem:** When admins created new users, they would automatically be logged in as that user, logging out the admin.

**Solution:** Created a server action that uses Supabase Admin API with service role key to create users without generating a client-side session.

**Files Changed:**

- `app/actions/create-user.ts` - New server action for admin user creation
- `app/utilisateurs/page.tsx` - Updated to use server action instead of client-side auth
- `lib/auth/auth.ts` - Added `autoSignIn` parameter (kept for backward compatibility)

**Required Setup:**

1. Get your Supabase service role key:
   - Go to Supabase Dashboard
   - Settings > API
   - Copy the `service_role` key (secret!)

2. Create `.env.local` file in the project root:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **IMPORTANT:** Never commit `.env.local` to version control!

### 2. Added Utilisateurs Menu to Sidebar for Admins

**Change:** The "Utilisateurs" menu is now visible to both super admins AND regular admins.

**Files Changed:**

- `components/AppLayout.tsx` - Added `isAdmin` state and updated menu visibility logic

**Behavior:**

- Super Admins: Can see and access Utilisateurs page
- Regular Admins: Can see and access Utilisateurs page
- Other roles: Cannot see the menu item

### 3. Created Sommaire Analytics Tab in Ventes Page

**New Feature:** Added comprehensive sales analytics accessible only to admins.

**Files Changed:**

- `app/ventes/page.tsx` - Added tab interface and analytics component

**Features:**

- **Tab Navigation:**
  - "Histoire" tab: Existing sales history view
  - "Sommaire" tab: Analytics dashboard (admin/super_admin only)

- **Analytics Included:**
  - Top 5 best-selling products (by revenue)
  - Best performing periods (days/weeks/months)
  - Worst performing periods for improvement insights
  - Date range filtering for focused analysis
  - Period type selector (day/week/month)

- **Metrics Shown:**
  - Product name and size
  - Quantity sold
  - Revenue generated
  - Number of transactions per period

## Role System Summary

Current roles in the system:

1. **super_admin** - Full access to everything
2. **admin** - Access to user management and analytics
3. **accueil** - Reception staff
4. **vendeur** - Sales staff
5. **comptable** - Accountant

## Testing Checklist

- [ ] Service role key added to `.env.local`
- [ ] Create a new user as admin - verify you stay logged in
- [ ] Check that both super_admin and admin can see "Utilisateurs" menu
- [ ] Test the Sommaire tab in Ventes page (admin/super_admin only)
- [ ] Verify analytics calculations are accurate
- [ ] Test different period types (day/week/month)
- [ ] Verify non-admin roles cannot see Sommaire tab

## Notes

- The service role key has full database access - keep it secure!
- Only deploy to production after setting the environment variable
- Analytics calculations are performed client-side for real-time updates
- All monetary values use the existing `formatPrice` function (e.g., 25k, 26.5k)
