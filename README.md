# Amex Wrapped

A Spotify Wrapped-style experience for American Express UK transactions. Upload your Amex CSV export and get beautiful visualizations of your spending patterns.

## Features

- **Privacy-First**: 100% client-side processing - your data never leaves your browser
- **CSV Import**: Drag and drop your Amex UK transaction export
- **Transaction Viewer**: Search, filter, and explore your transactions
- **Wrapped Experience**: Beautiful visualizations of your spending:
  - Total spend by category
  - Top merchants
  - Monthly trends
  - Fun spending stats
- **Shareable Cards**: Export wrapped cards as images to share

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build**: Vite
- **Routing**: TanStack Router
- **Tables**: TanStack Table
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **CSV Parsing**: PapaParse
- **Testing**: Vitest + Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd amex-wrapped

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Command                 | Description               |
| ----------------------- | ------------------------- |
| `npm run dev`           | Start development server  |
| `npm run build`         | Build for production      |
| `npm run preview`       | Preview production build  |
| `npm run lint`          | Run ESLint                |
| `npm run lint:fix`      | Fix ESLint errors         |
| `npm run format`        | Format code with Prettier |
| `npm run typecheck`     | Check TypeScript types    |
| `npm run test`          | Run tests in watch mode   |
| `npm run test:run`      | Run tests once            |
| `npm run test:coverage` | Run tests with coverage   |

## Usage

1. Go to [americanexpress.co.uk](https://www.americanexpress.co.uk)
2. Navigate to Statements & Activity
3. Click "Download" and select CSV format
4. Check "Include all additional transaction details"
5. Upload the CSV file to Amex Wrapped
6. Explore your spending wrapped!

## Project Structure

```
src/
├── components/
│   ├── ui/          # Reusable UI components
│   └── features/    # Feature-specific components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and helpers
├── types/           # TypeScript type definitions
├── routes/          # TanStack Router pages
├── store/           # State management (Zustand)
└── test/            # Test utilities
```

## Privacy

This app processes all data locally in your browser:

- **No server uploads**: Your CSV is parsed entirely client-side
- **No data storage**: Nothing is saved unless you use local persistence
- **No tracking**: No analytics or telemetry
- **No accounts**: No sign-up required

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:

- Code style and conventions
- Commit message format
- Pull request process

## License

MIT
