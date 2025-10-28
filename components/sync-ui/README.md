# Sync UI Components

This directory contains React components for displaying and interacting with wallet-profile synchronization features in ShotCaller.

## Components Overview

### Core Components

#### `SyncHelpTooltip`
Provides contextual help and tooltips for sync-related UI elements.

```typescript
import { SyncHelpTooltip } from './sync-help-tooltip';

// Basic usage
<SyncHelpTooltip type="status" status="synced" />

// With custom content
<SyncHelpTooltip type="info">
  <CustomSyncIndicator />
</SyncHelpTooltip>
```

#### `SyncHelpDialog`
Comprehensive help dialog with tabbed interface for sync documentation.

```typescript
import { SyncHelpDialog } from './sync-help-dialog';

// Default trigger
<SyncHelpDialog />

// Custom trigger
<SyncHelpDialog 
  trigger={<Button>Help</Button>}
  defaultTab="troubleshooting"
/>
```

#### `SyncOnboardingFlow`
Multi-step onboarding flow for new users to learn about sync functionality.

```typescript
import { SyncOnboardingFlow, useSyncOnboarding } from './sync-onboarding-flow';

function App() {
  const { showOnboarding, completeOnboarding } = useSyncOnboarding();
  
  return (
    <SyncOnboardingFlow
      isOpen={showOnboarding}
      onClose={() => setShowOnboarding(false)}
      onComplete={completeOnboarding}
    />
  );
}
```

### Specialized Components

#### `SyncStatusIndicator`
Displays current sync status with appropriate visual indicators.

```typescript
import { SyncStatusIndicator } from './sync-help-tooltip';

<SyncStatusIndicator 
  status="syncing" 
  showText={true}
  className="ml-2"
/>
```

#### `SyncRefreshButton`
Button component for triggering manual sync operations.

```typescript
import { SyncRefreshButton } from './sync-help-tooltip';

<SyncRefreshButton
  onClick={handleRefresh}
  isLoading={isSyncing}
  className="ml-auto"
/>
```

#### `SyncErrorBadge`
Displays sync errors with retry functionality.

```typescript
import { SyncErrorBadge } from './sync-help-tooltip';

<SyncErrorBadge
  error="Network connection failed"
  onRetry={handleRetry}
/>
```

#### `SyncOfflineIndicator`
Shows when the app is in offline mode.

```typescript
import { SyncOfflineIndicator } from './sync-help-tooltip';

<SyncOfflineIndicator className="fixed top-4 right-4" />
```

## Usage Patterns

### Navigation Integration

```typescript
// In navigation component
import { SyncStatusIndicator, SyncHelpDialog } from '@/components/sync-ui';

export function Navigation() {
  const { syncStatus } = useAuth();
  
  return (
    <nav className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Logo />
        <SyncStatusIndicator status={syncStatus?.status} />
      </div>
      
      <div className="flex items-center gap-2">
        <SyncHelpDialog />
        <UserMenu />
      </div>
    </nav>
  );
}
```

### Profile Page Integration

```typescript
// In profile page
import { 
  SyncRefreshButton, 
  SyncErrorBadge,
  SyncHelpTooltip 
} from '@/components/sync-ui';

export function ProfilePage() {
  const { profileData, syncStatus } = useAuth();
  const { forceSync, isLoading } = useManualSync();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <div className="flex items-center gap-2">
          <SyncHelpTooltip type="info" />
          <SyncRefreshButton 
            onClick={forceSync}
            isLoading={isLoading}
          />
        </div>
      </div>
      
      {syncStatus?.status === 'error' && (
        <SyncErrorBadge
          error={syncStatus.error}
          onRetry={forceSync}
        />
      )}
      
      <ProfileContent data={profileData} />
    </div>
  );
}
```

### Onboarding Integration

```typescript
// In app root or auth provider
import { SyncOnboardingFlow, useSyncOnboarding } from '@/components/sync-ui';

export function AppRoot() {
  const { 
    showOnboarding, 
    setShowOnboarding,
    completeOnboarding 
  } = useSyncOnboarding();
  
  return (
    <div>
      <App />
      
      <SyncOnboardingFlow
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={completeOnboarding}
        autoStart={false}
      />
    </div>
  );
}
```

## Styling Guidelines

### Theme Integration

All components use the shadcn/ui design system and respect the current theme:

```typescript
// Components automatically adapt to light/dark themes
// Use CSS variables for consistent theming
const statusColors = {
  synced: 'hsl(var(--success))',
  syncing: 'hsl(var(--warning))',
  error: 'hsl(var(--destructive))',
  offline: 'hsl(var(--muted-foreground))'
};
```

### Customization

Components accept standard className props for customization:

```typescript
// Custom styling
<SyncStatusIndicator 
  status="synced"
  className="bg-green-50 border-green-200 text-green-800"
/>

// Responsive design
<SyncHelpDialog 
  className="max-w-sm md:max-w-2xl"
/>
```

### Animation Guidelines

- Use subtle animations for status changes
- Respect user's motion preferences
- Keep animations under 300ms for responsiveness

```css
/* Example animation classes */
.sync-status-transition {
  transition: all 200ms ease-in-out;
}

.sync-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@media (prefers-reduced-motion: reduce) {
  .sync-pulse {
    animation: none;
  }
}
```

## Accessibility

### Keyboard Navigation

All interactive components support keyboard navigation:

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons and triggers
- **Escape**: Close dialogs and tooltips

### Screen Reader Support

Components include appropriate ARIA attributes:

```typescript
// Example ARIA implementation
<button
  aria-label="Sync status: Currently syncing"
  aria-describedby="sync-help-tooltip"
  role="button"
>
  <SyncStatusIndicator status="syncing" />
</button>
```

### Color and Contrast

- Status indicators use both color and icons
- Text meets WCAG AA contrast requirements
- High contrast mode support included

### Focus Management

- Visible focus indicators on all interactive elements
- Logical tab order maintained
- Focus trapped in modal dialogs

## Testing

### Component Testing

```typescript
// Example test for SyncStatusIndicator
import { render, screen } from '@testing-library/react';
import { SyncStatusIndicator } from './sync-help-tooltip';

describe('SyncStatusIndicator', () => {
  test('displays correct status', () => {
    render(<SyncStatusIndicator status="synced" showText />);
    
    expect(screen.getByText('synced')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label', 
      expect.stringContaining('synced')
    );
  });
  
  test('shows loading state', () => {
    render(<SyncStatusIndicator status="syncing" />);
    
    const indicator = screen.getByRole('button');
    expect(indicator).toHaveClass('animate-spin');
  });
});
```

### Integration Testing

```typescript
// Example integration test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SyncRefreshButton } from './sync-help-tooltip';

describe('SyncRefreshButton Integration', () => {
  test('triggers sync on click', async () => {
    const mockSync = jest.fn();
    render(<SyncRefreshButton onClick={mockSync} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(mockSync).toHaveBeenCalled();
    });
  });
});
```

### Accessibility Testing

```typescript
// Example accessibility test
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Sync Components Accessibility', () => {
  test('SyncHelpDialog has no accessibility violations', async () => {
    const { container } = render(<SyncHelpDialog />);
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });
});
```

## Performance Considerations

### Lazy Loading

Large components like the help dialog should be lazy loaded:

```typescript
import { lazy, Suspense } from 'react';

const SyncHelpDialog = lazy(() => import('./sync-help-dialog'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SyncHelpDialog />
    </Suspense>
  );
}
```

### Memoization

Use React.memo for components that receive frequent prop updates:

```typescript
import { memo } from 'react';

export const SyncStatusIndicator = memo(({ status, showText, className }) => {
  // Component implementation
});
```

### Event Handler Optimization

Use useCallback for event handlers passed to child components:

```typescript
const handleRefresh = useCallback(async () => {
  await syncManager.forceSync();
}, [syncManager]);
```

## Browser Support

### Minimum Requirements
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

### Progressive Enhancement
- Core functionality works without JavaScript
- Enhanced features require modern browser APIs
- Graceful degradation for older browsers

### Polyfills
Required polyfills are included in the build:
- ResizeObserver
- IntersectionObserver
- CSS custom properties

## Migration Guide

### From v0.x to v1.x

1. **Import Changes**
   ```typescript
   // Old
   import { SyncStatus } from './components/sync-status';
   
   // New
   import { SyncStatusIndicator } from './components/sync-ui';
   ```

2. **Prop Changes**
   ```typescript
   // Old
   <SyncStatus state="loading" />
   
   // New
   <SyncStatusIndicator status="syncing" />
   ```

3. **Event Handler Changes**
   ```typescript
   // Old
   <SyncButton onSync={handleSync} />
   
   // New
   <SyncRefreshButton onClick={handleSync} />
   ```

## Contributing

### Adding New Components

1. **Create Component File**
   ```typescript
   // components/sync-ui/new-component.tsx
   export function NewSyncComponent(props: NewSyncComponentProps) {
     // Implementation
   }
   ```

2. **Add Tests**
   ```typescript
   // components/sync-ui/__tests__/new-component.test.tsx
   describe('NewSyncComponent', () => {
     // Tests
   });
   ```

3. **Update Index**
   ```typescript
   // components/sync-ui/index.ts
   export { NewSyncComponent } from './new-component';
   ```

4. **Update Documentation**
   - Add component to this README
   - Include usage examples
   - Document props and behavior

### Code Style

- Use TypeScript for all components
- Follow existing naming conventions
- Include JSDoc comments for props
- Use consistent file structure

### Review Process

1. Create feature branch
2. Implement component with tests
3. Update documentation
4. Submit pull request
5. Address review feedback
6. Merge after approval

---

For more information, see the [Sync Developer Guide](../../docs/sync-developer-guide.md) or contact the development team.