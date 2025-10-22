# Multi-Tenant Authentication Frontend

A complete multi-tenant authentication system for tour operators built with Next.js 14, TypeScript, Supabase, and shadcn/ui.

## Features

✅ **Invitation-Only Signup**: Users can only sign up with valid invitation tokens  
✅ **Multi-Tenant Architecture**: Organization-based data isolation  
✅ **Role-Based Access Control**: Owner, Admin, Manager, Agent, Viewer roles  
✅ **Team Management**: Invite and manage team members  
✅ **Profile Management**: Update personal information and settings  
✅ **Password Management**: Change passwords and reset functionality  
✅ **Responsive Design**: Mobile-first approach with beautiful UI  
✅ **Type Safety**: Full TypeScript support with generated types  

## Project Structure

```
src/
├── app/
│   ├── (auth)/                    # Auth pages (login, signup, forgot-password)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/               # Protected dashboard pages
│   │   ├── dashboard/page.tsx
│   │   ├── settings/
│   │   │   ├── profile/page.tsx
│   │   │   └── team/page.tsx
│   │   └── layout.tsx
│   └── layout.tsx
├── components/
│   ├── auth/                      # Auth-specific components
│   ├── layout/                    # Layout components (navbar, sidebar)
│   └── ui/                        # shadcn/ui components
├── lib/
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useUser.ts
│   │   └── useInvitation.ts
│   ├── supabase/                  # Supabase client configuration
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── types/                     # TypeScript type definitions
│       ├── auth.ts
│       ├── user.ts
│       └── organization.ts
└── middleware.ts                  # Route protection middleware
```

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Setup

The system requires the following database schema (already implemented in your project):

- `organizations` - Tour operator companies
- `users` - User accounts linked to organizations
- `organization_invitations` - Invitation tokens for signup

### 3. Required RPC Functions

The system uses these Supabase RPC functions:

```sql
-- Validate invitation token
CREATE OR REPLACE FUNCTION validate_invitation_token(p_token TEXT)
RETURNS TABLE (
  invitation_id UUID,
  organization_id UUID,
  organization_name TEXT,
  organization_slug TEXT,
  email TEXT,
  role TEXT,
  is_valid BOOLEAN,
  error_message TEXT
) AS $$
-- Implementation here
$$ LANGUAGE plpgsql;

-- Get user profile with organization
CREATE OR REPLACE FUNCTION get_user_profile()
RETURNS TABLE (
  id UUID,
  auth_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  permissions JSONB,
  avatar_url TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  organization JSONB
) AS $$
-- Implementation here
$$ LANGUAGE plpgsql;

-- Create invitation
CREATE OR REPLACE FUNCTION create_invitation(
  p_organization_id UUID,
  p_email TEXT,
  p_role TEXT,
  p_invited_by UUID,
  p_expires_days INTEGER
)
RETURNS TABLE (
  invitation_id UUID,
  signup_url TEXT
) AS $$
-- Implementation here
$$ LANGUAGE plpgsql;
```

### 4. Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 5. Install shadcn/ui Components

```bash
npx shadcn@latest init
npx shadcn@latest add button input label card avatar dropdown-menu table badge sonner dialog select tabs separator alert checkbox textarea
```

## Authentication Flow

### 1. Admin Creates Organization
```typescript
// Via admin API (not part of this frontend)
POST /api/admin/create-organization
{
  "name": "Acme Tours",
  "owner_email": "john@acmetours.com"
}
// Returns: { signup_url: "https://app.com/signup?token=xyz..." }
```

### 2. User Receives Invitation
- Admin sends invitation email with signup URL
- URL format: `https://app.com/signup?token=xyz...`

### 3. User Signs Up
- User clicks signup link
- App validates invitation token
- Shows organization info and role
- User creates account with password
- Account automatically linked to organization

### 4. User Logs In
- User enters email/password
- App authenticates with Supabase
- Loads user profile with organization
- Redirects to dashboard

### 5. Team Management
- Owners/Admins can invite team members
- Invitations sent via email with signup URLs
- Role-based permissions enforced

## Key Components

### Auth Hooks

- **`useAuth`**: Main authentication hook with session management
- **`useUser`**: User profile management
- **`useInvitation`**: Invitation token validation

### Pages

- **Signup**: Invitation-validated account creation
- **Login**: Email/password authentication
- **Dashboard**: Protected main application
- **Profile Settings**: Personal information management
- **Team Management**: Invite and manage team members

### Layout Components

- **Sidebar**: Navigation with organization context
- **Navbar**: Search, notifications, user menu
- **Auth Layout**: Beautiful auth pages with branding

## Security Features

- **Row Level Security (RLS)**: Database-level data isolation
- **Invitation-Only Signup**: No public registration
- **Role-Based Permissions**: Granular access control
- **Session Management**: Secure authentication flow
- **Password Security**: Strong password requirements

## Design System

- **Color Scheme**: Professional blue/gray palette
- **Typography**: Inter/Geist Sans fonts
- **Components**: shadcn/ui component library
- **Responsive**: Mobile-first design
- **Accessibility**: Semantic HTML and ARIA labels

## Testing Checklist

- [ ] User can access signup page with valid token
- [ ] Signup shows organization name correctly
- [ ] User can create account and is redirected to dashboard
- [ ] User can login with created credentials
- [ ] Dashboard shows user's organization data only
- [ ] Protected routes redirect to login when not authenticated
- [ ] User can update profile information
- [ ] Owner/admin can invite team members
- [ ] Invalid/expired tokens show appropriate errors
- [ ] Mobile responsive on all pages
- [ ] All forms validate inputs correctly
- [ ] Logout works and clears session

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

1. Set up Supabase project with required schema
2. Configure environment variables
3. Deploy to Vercel/Netlify
4. Set up custom domain
5. Configure email templates for invitations

## Support

For issues or questions:
- Check the Supabase documentation
- Review the shadcn/ui component library
- Ensure all environment variables are set correctly
- Verify database schema and RPC functions are implemented

---

**Built with ❤️ for Tour Operators**
