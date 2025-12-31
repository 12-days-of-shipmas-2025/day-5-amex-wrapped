# Contributing to Amex Wrapped

Thank you for your interest in contributing! This document outlines our coding standards, commit conventions, and development workflow.

## Code Quality Standards

### TypeScript

- Use strict TypeScript - no `any` types unless absolutely necessary
- Define interfaces/types for all data structures
- Use type inference where obvious, explicit types where not
- Prefer `const` over `let`, never use `var`

### React

- Use functional components with hooks
- Keep components small and focused (< 200 lines)
- Extract custom hooks for reusable logic
- Use proper error boundaries

### Naming Conventions

| Type       | Convention                  | Example                       |
| ---------- | --------------------------- | ----------------------------- |
| Components | PascalCase                  | `TransactionTable.tsx`        |
| Hooks      | camelCase with `use` prefix | `useTransactions.ts`          |
| Utils      | camelCase                   | `parseCSV.ts`                 |
| Types      | PascalCase                  | `Transaction`, `AmexCategory` |
| Constants  | SCREAMING_SNAKE_CASE        | `MAX_FILE_SIZE`               |

### File Structure

```
src/
├── components/     # React components
│   ├── ui/        # Reusable UI components (shadcn)
│   └── features/  # Feature-specific components
├── hooks/         # Custom React hooks
├── lib/           # Utilities and helpers
├── types/         # TypeScript type definitions
├── routes/        # TanStack Router route components
├── store/         # State management (Zustand)
└── test/          # Test utilities and setup
```

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear, semantic version control.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type       | Description                        |
| ---------- | ---------------------------------- |
| `feat`     | New feature                        |
| `fix`      | Bug fix                            |
| `docs`     | Documentation only                 |
| `style`    | Formatting, no code change         |
| `refactor` | Code change, no new feature or fix |
| `perf`     | Performance improvement            |
| `test`     | Adding/updating tests              |
| `chore`    | Build process, dependencies        |

### Scope (Optional)

- `csv` - CSV parsing logic
- `ui` - User interface
- `chart` - Charts/visualizations
- `router` - Routing
- `store` - State management

### Examples

```bash
# Feature
feat(csv): add support for multi-currency transactions

# Bug fix
fix(chart): correct category totals calculation

# Documentation
docs: update README with setup instructions

# Refactor
refactor(ui): extract TransactionRow into separate component

# Tests
test(csv): add tests for date parsing edge cases
```

### Commit Message Guidelines

1. **Subject line**
   - Keep under 72 characters
   - Use imperative mood ("add" not "added")
   - Don't end with period

2. **Body** (optional)
   - Explain _what_ and _why_, not _how_
   - Wrap at 72 characters

3. **Footer** (optional)
   - Reference issues: `Closes #123`
   - Breaking changes: `BREAKING CHANGE: description`

---

## Development Workflow

### Setup

```bash
# Clone and install
git clone <repo>
cd amex-wrapped
npm install

# Start dev server
npm run dev

# Run tests
npm run test

# Run linting
npm run lint
```

### Before Committing

1. **Run linting**: `npm run lint`
2. **Run tests**: `npm run test`
3. **Check types**: `npm run typecheck`
4. **Format code**: `npm run format`

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear commits
3. Ensure all tests pass
4. Update documentation if needed
5. Submit PR with clear description
6. Address review feedback

---

## Testing Guidelines

### What to Test

- **Utils/Helpers**: 100% coverage for pure functions
- **Hooks**: Test state changes and effects
- **Components**: Test user interactions and rendering
- **Integration**: Test critical user flows

### Test File Naming

- `Component.test.tsx` - Component tests
- `useHook.test.ts` - Hook tests
- `util.test.ts` - Utility tests

### Test Structure

```tsx
describe('ComponentName', () => {
  describe('when condition', () => {
    it('should expected behavior', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

---

## Code Review Checklist

Before requesting review, ensure:

- [ ] Code follows our TypeScript and React conventions
- [ ] No `console.log` statements (use proper logging)
- [ ] No hardcoded values (use constants/config)
- [ ] Error states are handled
- [ ] Loading states are handled
- [ ] Tests are written for new functionality
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventions

---

## Questions?

Open an issue for any questions about contributing!
