# Library Best Practices

This document outlines best practices for using the key libraries in this project.

## React i18next

### Basic Usage

Use the `useTranslation` hook for simple translations:

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('home.title')}</h1>;
}
```

### Trans Component for Complex Translations

Use the `Trans` component when translations contain HTML elements or links:

```tsx
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';

function ErrorMessage() {
  const { t } = useTranslation();
  
  return (
    <Trans
      i18nKey="errors.networkWithLink"
      components={[
        <Link to="/settings" className="underline" />
      ]}
    />
  );
}
```

Translation JSON:
```json
{
  "errors": {
    "networkWithLink": "Network error. Please <0>check your connection</0> or try again later."
  }
}
```

The `<0>...</0>` tags map to the components array index.

### Language Switching

Always update document attributes when changing language:

```tsx
const changeLanguage = async (lng: string) => {
  await i18n.changeLanguage(lng);
  document.documentElement.dir = lng === 'ar-SA' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  localStorage.setItem('i18nextLng', lng);
};
```

## React Router

### Use Link Instead of Anchor Tags

**❌ Bad:**
```tsx
<a href="/app/123">View App</a>
```

**✅ Good:**
```tsx
import { Link } from 'react-router';

<Link to="/app/123">View App</Link>
```

### Programmatic Navigation

Use `useNavigate` for programmatic navigation:

```tsx
import { useNavigate } from 'react-router';

function MyComponent() {
  const navigate = useNavigate();
  
  const handleSubmit = () => {
    // Navigate to a route
    navigate('/dashboard');
    
    // Navigate with state
    navigate('/dashboard', { state: { from: 'login' } });
    
    // Replace history entry
    navigate('/dashboard', { replace: true });
    
    // Go back
    navigate(-1);
  };
}
```

### Access Route Parameters

Use `useParams` to access dynamic route parameters:

```tsx
import { useParams } from 'react-router';

function AppView() {
  const { id } = useParams();
  // id will be the value from /app/:id
}
```

### Access Query Parameters

Use `useSearchParams` for query string parameters:

```tsx
import { useSearchParams } from 'react-router';

function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
}
```

## Drizzle ORM

### Schema Definition

Define schemas using Drizzle's type-safe API:

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique(),
});
```

### Migration Workflow

1. **Make schema changes** in `worker/database/schema.ts`
2. **Generate migrations**: `npm run db:generate`
3. **Validate migrations**: `npm run db:validate`
4. **Apply locally**: `npm run db:migrate:local`
5. **Apply to remote**: `npm run db:migrate:remote`

### Migration Validation

Always run validation before deploying:

```bash
npm run db:validate
```

This checks:
- Schema file exists
- Migrations directory exists
- No pending migrations
- Migration format is correct

### Best Practices

1. **Always generate migrations** after schema changes
2. **Test migrations locally** before applying to remote
3. **Review generated SQL** in migration files
4. **Never edit migration files directly** - regenerate if needed
5. **Use transactions** for complex migrations
6. **Backup database** before applying migrations in production

## General Guidelines

### Type Safety

- Always use TypeScript types from libraries
- Use `satisfies` for configuration objects when possible
- Leverage library-provided types instead of creating your own

### Performance

- Use `Link` components for client-side navigation (faster than full page reloads)
- Lazy load translation files if you have many languages
- Use `useMemo` for expensive translation operations

### Accessibility

- Always provide `aria-label` for icon-only buttons
- Use semantic HTML elements
- Ensure RTL layout works correctly for Arabic

