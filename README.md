# Amex Wrapped

A Spotify Wrapped-style experience for your American Express transactions. Upload your Amex CSV export and get beautiful visualizations of your spending patterns.

**Live Site: [amexwrapped.com](https://amexwrapped.com)**

## Supported Regions

Currently tested and working with:

- **UK** - American Express UK statement exports
- **Mexico** - American Express Mexico statement exports

Have a different format? [Chat with us](https://humanwritten.ai?chat=open) for support - we'd love to add more regions!

## Features

- **Privacy-First**: 100% client-side processing - your data never leaves your browser
- **CSV Import**: Drag and drop your Amex transaction export
- **Beautiful Visualizations**:
  - Total spend by category
  - Top merchants
  - Monthly spending trends
  - Balance over time
  - Foreign currency spending
  - Fun spending stats
- **Interactive Story Mode**: Swipe through your year in spending
- **Demo Mode**: Try it out with sample data before uploading your own

## Privacy

This app processes all data locally in your browser:

- **No server uploads**: Your CSV is parsed entirely client-side
- **No data storage**: Nothing is saved to any server
- **No tracking**: No analytics or telemetry
- **No accounts**: No sign-up required
- **Open source**: Verify the code yourself

## How to Export Your Amex Data

### UK

1. Go to [americanexpress.co.uk](https://www.americanexpress.co.uk)
2. Navigate to **Statements & Activity**
3. Click **Download** and select **CSV** format
4. Check "Include all additional transaction details"
5. Upload to Amex Wrapped

### Mexico

1. Go to [americanexpress.com.mx](https://www.americanexpress.com.mx)
2. Navigate to **Estados de Cuenta**
3. Download your statement in CSV format
4. Upload to Amex Wrapped

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build**: Vite
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **CSV Parsing**: PapaParse

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/12daysofshipmas/day-5-amex-wrapped.git
cd day-5-amex-wrapped

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Command             | Description              |
| ------------------- | ------------------------ |
| `npm run dev`       | Start development server |
| `npm run build`     | Build for production     |
| `npm run preview`   | Preview production build |
| `npm run lint`      | Run ESLint               |
| `npm run typecheck` | Check TypeScript types   |

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

Want to add support for your region's Amex format? Open an issue or PR with sample CSV structure (anonymized data only).

## Support

Having issues or want to request a new region? [Chat with us](https://humanwritten.ai?chat=open) or open a GitHub issue.

## License

MIT

---

Part of [12 Days of Shipmas](https://github.com/12daysofshipmas) - Day 5
