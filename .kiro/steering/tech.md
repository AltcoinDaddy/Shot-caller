# Technology Stack

## Framework & Runtime
- **Next.js 15.2.4** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript 5** - Type-safe development
- **Node.js** - Runtime environment

## Styling & UI
- **Tailwind CSS 4.1.9** - Utility-first CSS framework
- **shadcn/ui** - Component library (New York style)
- **Radix UI** - Headless UI primitives for accessibility
- **Lucide React** - Icon library
- **Class Variance Authority (CVA)** - Component variant management
- **Tailwind Animate** - Animation utilities

## State Management & Forms
- **React Hook Form 7.60.0** - Form handling
- **Zod 3.25.76** - Schema validation
- **@hookform/resolvers** - Form validation integration

## Additional Libraries
- **next-themes** - Dark/light mode support
- **Geist** - Font family
- **date-fns** - Date manipulation
- **Recharts** - Data visualization
- **Sonner** - Toast notifications
- **Embla Carousel** - Carousel component

## Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## Package Manager
- **pnpm** - Fast, disk space efficient package manager

## Common Commands

### Development
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Package Management
```bash
pnpm install      # Install dependencies
pnpm add <pkg>    # Add new package
pnpm remove <pkg> # Remove package
```

## Configuration Notes
- TypeScript strict mode enabled
- ESLint and TypeScript errors ignored during builds (development setup)
- Images unoptimized for deployment flexibility
- Path aliases configured (@/* maps to root)
- CSS variables enabled for theming