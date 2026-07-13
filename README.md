# Fair Path - Expense Splitting App

Fair Path is a modern, beautiful expense splitting application built with Next.js, Neon PostgreSQL, Drizzle ORM, Better Auth, and Zod validators.

## Features

✨ **Group Expense Management** - Create groups and track shared expenses
💰 **Smart Settlements** - Automatically calculates who owes whom
👥 **Member Management** - Add and remove group members
📊 **Expense Tracking** - Track all expenses with detailed splits
✅ **Settlement Tracking** - Mark payments as settled and keep history
🎨 **Beautiful UI** - Modern, responsive design with Tailwind CSS
🔐 **Secure Authentication** - Email/password auth with Better Auth

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Next.js Server Actions, API Routes
- **Database**: Neon PostgreSQL
- **ORM**: Drizzle ORM
- **Auth**: Better Auth (email + password)
- **Validation**: Zod
- **UI Components**: shadcn/ui, Radix UI

## Project Structure

```
fair-path/
├── app/
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Home page (redirects to /groups)
│   ├── sign-in/                # Authentication pages
│   ├── sign-up/
│   ├── groups/
│   │   ├── page.tsx            # Groups list page
│   │   └── [id]/               # Group details page
│   └── actions/
│       ├── groups.ts           # Group server actions
│       └── expenses.ts         # Expense/settlement server actions
├── components/
│   ├── ui/                     # Base UI components
│   ├── auth-form.tsx           # Shared auth form
│   ├── groups-list.tsx         # Groups listing
│   ├── create-group-dialog.tsx # Create group modal
│   ├── group-header.tsx        # Group header with delete
│   ├── group-members.tsx       # Member management
│   ├── expenses-list.tsx       # Expenses listing and creation
│   └── settlements-list.tsx    # Settlements display
├── lib/
│   ├── auth.ts                 # Better Auth configuration
│   ├── auth-client.ts          # Client-side auth utilities
│   ├── db/
│   │   ├── index.ts            # Drizzle client
│   │   └── schema.ts           # Database schema
│   ├── validators.ts           # Zod validators
│   └── utils.ts                # Utility functions
├── app/globals.css             # Global styles and design tokens
├── .env.example                # Environment variables template
└── .env.local                  # Local environment variables
```

## Database Schema

### Tables

**user** - Better Auth user table
```sql
- id (TEXT, PRIMARY KEY)
- name (TEXT)
- email (TEXT, UNIQUE)
- emailVerified (BOOLEAN)
- image (TEXT)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

**groups** - Expense groups
```sql
- id (UUID, PRIMARY KEY)
- userId (TEXT) - Group creator
- name (TEXT)
- description (TEXT)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

**group_members** - Group membership
```sql
- id (UUID, PRIMARY KEY)
- groupId (UUID)
- userId (TEXT)
- createdAt (TIMESTAMP)
```

**expenses** - Individual expenses
```sql
- id (UUID, PRIMARY KEY)
- groupId (UUID)
- paidBy (TEXT) - User who paid
- description (TEXT)
- amount (DECIMAL)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

**expense_splits** - How expense was split
```sql
- id (UUID, PRIMARY KEY)
- expenseId (UUID)
- userId (TEXT)
- splitAmount (DECIMAL)
- createdAt (TIMESTAMP)
```

**settlements** - Payment settlements
```sql
- id (UUID, PRIMARY KEY)
- groupId (UUID)
- from (TEXT) - Debtor
- to (TEXT) - Creditor
- amount (DECIMAL)
- settled (BOOLEAN)
- settledAt (TIMESTAMP)
- createdAt (TIMESTAMP)
```

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Database

1. Create a Neon PostgreSQL database
2. Copy the connection string
3. Add it to `.env.local`:

```env
DATABASE_URL=postgresql://user:password@host/database
```

### 3. Generate Auth Secret

```bash
openssl rand -base64 32
```

Add to `.env.local`:

```env
BETTER_AUTH_SECRET=<generated-secret>
BETTER_AUTH_URL=http://localhost:3000
```

### 4. Create Database Tables

The tables are automatically created when you set up the Neon database. If needed, run:

```sql
-- Create all tables (already done in Neon setup)
-- The schema.ts file defines the structure
```

### 5. Start Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` to see your app!

## Environment Variables

Create a `.env.local` file:

```env
# Database
DATABASE_URL=postgresql://...

# Better Auth
BETTER_AUTH_SECRET=your-secret-here (min 32 chars)
BETTER_AUTH_URL=http://localhost:3000

# Node
NODE_ENV=development
```

## API Routes

### Authentication
- `POST /api/auth/sign-up` - Register new user
- `POST /api/auth/sign-in` - Login user
- `POST /api/auth/sign-out` - Logout user

### Groups
- `GET /api/groups` - List user's groups
- `POST /api/groups` - Create new group
- `GET /api/groups/:id` - Get group details
- `POST /api/groups/:id/members` - Add member
- `DELETE /api/groups/:id` - Delete group

### Expenses
- `GET /api/groups/:id/expenses` - List group expenses
- `POST /api/groups/:id/expenses` - Create expense
- `DELETE /api/expenses/:id` - Delete expense

### Settlements
- `GET /api/groups/:id/settlements` - Get settlements
- `POST /api/settlements/:id/mark-settled` - Mark as settled

## Server Actions

All data mutations use Next.js Server Actions:

```typescript
// app/actions/groups.ts
export async function createGroup(input: CreateGroupInput)
export async function getGroups()
export async function getGroupById(groupId: string)
export async function deleteGroup(groupId: string)
export async function addMemberToGroup(input: AddMemberInput)

// app/actions/expenses.ts
export async function createExpense(input: CreateExpenseInput)
export async function getExpensesByGroup(groupId: string)
export async function deleteExpense(expenseId: string)
export async function getGroupSettlements(groupId: string)
export async function markSettled(settlementId: string)
```

## Validators

All inputs are validated with Zod:

```typescript
// From lib/validators.ts
- createGroupSchema
- updateGroupSchema
- createExpenseSchema
- updateExpenseSchema
- addMemberSchema
- markSettledSchema
```

## Key Features

### Smart Settlement Calculation

The app automatically calculates who owes whom using a sophisticated algorithm:

1. Tracks total paid per user
2. Calculates total owed per user
3. Determines net balances (positive = creditor, negative = debtor)
4. Creates optimal settlement transactions

### User Scoping

All queries are scoped by user ID to ensure data privacy:

```typescript
const userId = await getUserId() // From session
// All queries filter by userId
where(eq(table.userId, userId))
```

### Responsive Design

- Mobile-first approach
- Tailwind CSS grid system
- Smooth transitions and hover effects
- Dark mode support

## Deployment

### Deploy to Vercel

```bash
git push  # Push to GitHub
```

Then connect your repository to Vercel and set environment variables.

## Color Scheme

Modern, professional palette with beautiful gradients:

- **Primary**: Indigo (#6366f1)
- **Secondary**: Pink (#ec4899)
- **Accent**: Cyan (#06b6d4)
- **Background**: Light (#ffffff) / Dark (#0f172a)
- **Foreground**: Dark (#1a1a1a) / Light (#f8fafc)

## Future Enhancements

- 📱 Mobile app with React Native
- 🔔 Notifications for settlements
- 📊 Expense analytics and charts
- 💳 Automatic payment integration
- 📤 Export expenses to CSV
- 🌍 Multi-currency support
- 📸 Receipt image uploads
- 🤖 AI-powered expense categorization

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check Neon project is active
- Ensure firewall allows connections

### Auth Not Working
- Verify BETTER_AUTH_SECRET is set (min 32 chars)
- Check BETTER_AUTH_URL matches your domain
- Clear browser cookies and cache

### Missing Modules
```bash
# Reinstall dependencies
pnpm install

# Clear Next.js cache
rm -rf .next
pnpm dev
```

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions, please check the documentation or open an issue on GitHub.

---

Built with ❤️ using Next.js, Neon, and Drizzle
