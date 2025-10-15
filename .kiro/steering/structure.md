# Project Structure

## Directory Organization

### `/app` - Next.js App Router
- **`layout.tsx`** - Root layout with navigation
- **`page.tsx`** - Homepage with hero section and features
- **`globals.css`** - Global styles and CSS variables
- **`/leaderboard`** - Leaderboard page with rankings and rewards
- **`/profile`** - User profile with NFT collection and stats
- **`/results`** - Results and scoring pages
- **`/rules`** - Game rules and documentation
- **`/team`** - Team management and lineup building

### `/components` - Reusable Components
- **`navigation.tsx`** - Main site navigation
- **`theme-provider.tsx`** - Theme context provider
- **`/ui`** - shadcn/ui component library
  - Complete set of accessible UI primitives
  - Consistent styling with Tailwind CSS
  - TypeScript definitions included

### `/hooks` - Custom React Hooks
- **`use-mobile.ts`** - Mobile device detection
- **`use-toast.ts`** - Toast notification management

### `/lib` - Utility Functions
- **`utils.ts`** - Common utility functions (cn, clsx, etc.)

### `/public` - Static Assets
- **Sports action images** - NBA and NFL player photos
- **UI assets** - Logos, placeholders, icons
- **Trophy and celebration images** - For rewards and achievements

### `/styles` - Additional Styling
- **`globals.css`** - Extended global styles

## File Naming Conventions
- **Pages**: `page.tsx` (App Router convention)
- **Layouts**: `layout.tsx` (App Router convention)
- **Components**: PascalCase (e.g., `Navigation.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `use-mobile.ts`)
- **Utilities**: kebab-case (e.g., `utils.ts`)

## Import Patterns
- Use path aliases: `@/components`, `@/lib`, `@/hooks`
- Import UI components from `@/components/ui`
- Import utilities from `@/lib/utils`

## Component Architecture
- **Client Components**: Use `"use client"` directive for interactivity
- **Server Components**: Default for static content and data fetching
- **Compound Components**: UI components follow Radix UI patterns
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## Styling Approach
- **Tailwind CSS**: Utility-first styling
- **CSS Variables**: For theming and dynamic colors
- **Component Variants**: Using CVA for component variations
- **Animations**: Custom CSS animations with Tailwind classes
- **Responsive**: Mobile-first responsive design

## Data Flow
- **Mock Data**: Currently using static mock data for development
- **State Management**: React hooks and local state
- **Forms**: React Hook Form with Zod validation
- **Theming**: Context-based theme switching