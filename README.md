# Contacts Management Application

A modern, full-featured contacts management application with advanced UI/UX, duplicate detection, and comprehensive contact management capabilities.

## 🚀 Tech Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with custom components
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **Styling**: Tailwind CSS with custom design system
- **Drag & Drop**: @dnd-kit for advanced interactions
- **Icons**: Lucide React
- **Code Quality**: ESLint, TypeScript strict mode, comprehensive JSDoc
- **Performance**: React.memo, useCallback, optimized re-renders

## 📁 Project Structure

```
contacts-app/
├── app/                           # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── contacts/             # Contact CRUD operations
│   │   └── upload/               # File upload handling
│   ├── contacts/                 # Main contacts page
│   └── globals.css               # Global styles
├── components/                    # React components
│   ├── ui/                       # shadcn/ui base components
│   ├── contact-form.tsx          # Main form with validation
│   ├── contact-card.tsx          # Contact display component
│   ├── contact-view.tsx          # Detailed contact view
│   ├── draggable-email-list.tsx  # Drag-and-drop email management
│   ├── draggable-phone-list.tsx  # Drag-and-drop phone management
│   ├── duplicate-confirmation-dialog.tsx # Smart duplicate handling
│   └── error-boundary.tsx        # Error handling component
├── lib/                          # Utilities and configuration
│   ├── db.ts                     # Supabase connection
│   ├── types.ts                  # TypeScript definitions
│   ├── formatters.ts             # Phone/email formatting utilities
│   └── utils.ts                  # shadcn/ui utilities
├── supabase/                     # Database migrations
│   └── migrations/               # SQL migration files
└── public/uploads/               # Uploaded images
```

## 🛠️ Development Setup

### Prerequisites

- **Node.js 18+** (recommended: 20.x)
- **npm** or **yarn**
- **Supabase account** (free tier available)

### Installation & Setup

1. **Clone and install dependencies:**
   ```bash
   cd contacts-app
   npm install
   ```

2. **Set up Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your credentials
   - Create `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Set up the database:**
   - Go to Supabase Dashboard > SQL Editor
   - Run the migration scripts from `supabase/migrations/`:
     - `001_initial_schema.sql` - Creates contacts, contact_emails, contact_phones tables
     - `002_multiple_emails_phones.sql` - Adds support for multiple emails/phones

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000/contacts](http://localhost:3000/contacts)

## 📜 Available Scripts

### Development
- `npm run dev` - Start Next.js development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start the production server

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run type-check` - Run TypeScript type checking

### Database Testing
- `node scripts/test-supabase.js` - Test Supabase connection and functionality

## 🗄️ Database Schema

The application uses Supabase (PostgreSQL) with the following normalized schema:

```sql
-- Main contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  image_url TEXT,
  last_contact_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Multiple emails per contact
CREATE TABLE contact_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Multiple phones per contact
CREATE TABLE contact_phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🎯 Key Features

### Core Functionality
- ✅ **Full CRUD Operations**: Create, read, update, delete contacts
- ✅ **Multiple Emails/Phones**: Support for multiple contact methods per person
- ✅ **Drag & Drop Reordering**: Intuitive reordering of emails and phones
- ✅ **Primary Designation**: First item automatically becomes primary
- ✅ **Smart Duplicate Detection**: Prevents duplicate contacts with merge options
- ✅ **Image Upload**: Profile picture upload with validation
- ✅ **Search & Pagination**: Full-text search with pagination
- ✅ **Responsive Design**: Mobile-first, works on all devices

### Advanced Features
- ✅ **Real-time Validation**: Email format, phone format, date validation
- ✅ **Phone Number Formatting**: Auto-formatting as (XXX) XXX-XXXX
- ✅ **Date Validation**: Prevents future dates for "Last Contacted"
- ✅ **Duplicate Merge Logic**: Smart merging with conflict resolution
- ✅ **Error Boundaries**: Graceful error handling throughout
- ✅ **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- ✅ **Performance Optimized**: React.memo, useCallback, efficient re-renders

### UI/UX Features
- ✅ **Modern Design**: Clean, professional interface
- ✅ **Smooth Animations**: Hover effects, transitions, loading states
- ✅ **Intuitive Interactions**: Click-to-view, drag-to-reorder
- ✅ **Visual Feedback**: Loading states, success/error messages
- ✅ **Empty States**: Helpful messages when no contacts exist

## 🔧 API Endpoints

### Contacts
- `GET /api/contacts` - List contacts with search and pagination
- `POST /api/contacts` - Create new contact with duplicate checking
- `PUT /api/contacts` - Merge contact with existing (duplicate resolution)
- `GET /api/contacts/[id]` - Get specific contact
- `PUT /api/contacts/[id]` - Update contact
- `DELETE /api/contacts/[id]` - Delete contact

### File Upload
- `POST /api/upload` - Upload profile images

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy automatically on push to main branch

### Other Platforms
- **Railway**: Supports Next.js and PostgreSQL
- **Heroku**: Add PostgreSQL addon
- **Netlify**: For static deployment (API routes won't work)

## 📚 Code Quality & Documentation

### Documentation Standards
- **JSDoc Comments**: Every function has purpose statements and contracts
- **Type Safety**: Comprehensive TypeScript interfaces
- **Clean Architecture**: Well-organized components and utilities
- **Error Handling**: Comprehensive error boundaries and user feedback

### Performance Optimizations
- **React.memo**: Prevents unnecessary re-renders
- **useCallback**: Memoizes callback functions
- **Efficient State Management**: Optimized state updates
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic with Next.js

### Security Features
- **Input Sanitization**: XSS protection
- **Type Validation**: Runtime type checking
- **Error Boundaries**: Graceful error handling
- **SQL Injection Protection**: Parameterized queries

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Failed**
   - Verify environment variables are correct
   - Check Supabase project is active
   - Check Supabase scheme is consistent with project schema
   - Run `node scripts/test-supabase.js` to diagnose

2. **Build Errors**
   - Run `npm run lint:fix` to fix linting issues
   - Check TypeScript errors with `npm run type-check`

3. **Database Issues**
   - Ensure migration scripts have been run
   - Check Supabase dashboard for table structure

### Getting Help
- Check the browser console for error messages
- Review the terminal output for build/run errors
- Verify all environment variables are set correctly

## 📝 Development Notes

- The project uses shadcn/ui components for consistent UI
- All database operations use Supabase client with proper error handling
- Code is formatted with Prettier and linted with ESLint
- TypeScript provides strict type safety throughout
- Comprehensive JSDoc documentation for all functions
- Performance optimized with React best practices

## 🎉 Handoff Checklist

For the next engineer, ensure you have:
- [ ] Supabase project credentials
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] All dependencies installed (`npm install`)
- [ ] Development server running (`npm run dev`)
- [ ] Build passing (`npm run build`)
- [ ] No linting errors (`npm run lint`)

The codebase is production-ready with comprehensive error handling, type safety, and excellent user experience!
