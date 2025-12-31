# Amex Wrapped - Research Document

## Project Overview

**Goal:** Build a browser-based "Spotify Wrapped" style experience for American Express UK card transactions.

**Architecture:** 100% client-side processing - data never leaves the user's device.

---

## API Research

### American Express API

**Finding: No personal API access available**

| Option              | Status          | Details                                                                                                 |
| ------------------- | --------------- | ------------------------------------------------------------------------------------------------------- |
| Official API        | Not viable      | Requires PSD2 TPP registration, FCA authorization, eIDAS certificates. For financial institutions only. |
| Plaid               | Possible future | Free tier (200 calls). Would require app setup.                                                         |
| Unofficial Ruby Gem | Risky           | [timrogers/amex](https://github.com/timrogers/amex) - Uses internal iPhone app API. UK only, may break. |
| **CSV Export**      | **Selected**    | Manual download from Amex UK website. Last 6 billing periods. Reliable.                                 |

**Decision:** Use CSV import for MVP. Simple, reliable, no API dependencies.

### Trading 212 API (Future Scope)

Well-documented API available for future integration:

- Auth: HTTP Basic (API Key + Secret)
- Endpoints: Account info, positions, orders, dividends, transactions
- TypeScript library: [bennycode/trading212-api](https://github.com/bennycode/trading212-api)

---

## Amex UK CSV Format

### Schema

```csv
Date,Description,Amount,Extended Details,Appears On Your Statement As,Address,Town/City,Postcode,Country,Reference,Category
```

### Field Definitions

| Field                        | Format     | Example                     | Notes                              |
| ---------------------------- | ---------- | --------------------------- | ---------------------------------- |
| Date                         | DD/MM/YYYY | 30/12/2025                  | UK date format                     |
| Description                  | String     | TESCO PETROL 3731...        | Merchant name + location           |
| Amount                       | Decimal    | 59.25 / -123.30             | Positive=charge, Negative=refund   |
| Extended Details             | String     | Foreign Spend Amount...     | FX info, ticket details (optional) |
| Appears On Your Statement As | String     | Same as Description         |                                    |
| Address                      | String     | 82A JAMES CARTER ROAD       | Can be multiline                   |
| Town/City                    | String     | LONDON                      |                                    |
| Postcode                     | String     | EC2A 2DB                    |                                    |
| Country                      | String     | UNITED KINGDOM OF GB AND NI |                                    |
| Reference                    | String     | 'AT253610043000010826778'   | Transaction ID                     |
| Category                     | String     | Entertainment-Restaurants   | Amex's categorization              |

### Categories Observed

**Business Services:**

- Business Services-Professional Services
- Business Services-Internet Services

**General Purchases:**

- General Purchases-Computer Supplies
- General Purchases-Online Purchases
- General Purchases-Fuel
- General Purchases-General Retail
- General Purchases-Clothing Stores

**Entertainment:**

- Entertainment-Restaurants
- Entertainment-Bars & Cafes

**Travel:**

- Travel-Airline

### Special Cases

1. **Refunds:** Negative amounts (e.g., -123.30)
2. **Foreign Transactions:** Extended Details contains FX info
   ```
   Foreign Spend Amount: 12.00 UNITED STATES DOLLAR
   Commission Amount: 0.27
   Currency Exchange Rate: 1.3363
   ```
3. **Travel Bookings:** Extended Details contains routing/ticket info
   ```
   ROUTING: FROM: PORTO TO: BRISTOL
   CARRIER: U2 CLASS: Y
   TICKET NUMBER: KBPP6CM
   PASSENGER NAME: JOHN DOE
   ```
4. **Multiline Addresses:** Addresses can span multiple lines within quotes

---

## Existing Open Source Projects

### Wrapped-Style Experiences

| Project                                                                        | Tech                | Useful For                      |
| ------------------------------------------------------------------------------ | ------------------- | ------------------------------- |
| [open-source-wrapped](https://github.com/Schroedinger-Hat/open-source-wrapped) | Next.js, TypeScript | UI patterns, year-review format |
| [github-wrapped](https://git-wrapped.com/)                                     | React               | Visualization approach          |

### Transaction Analyzers

| Project                                                                       | Tech          | Features          |
| ----------------------------------------------------------------------------- | ------------- | ----------------- |
| [banking-class](https://github.com/eli-goodfriend/banking-class)              | Python        | ML categorization |
| [BankStatementAnalyzer](https://github.com/TarunKumarR/BankStatementAnalyzer) | Python/Pandas | Monthly analysis  |

---

## Tech Stack Decision

### Selected Stack

```
Frontend-Only (Browser-Based):
├── Vite (build tool)
├── React 19 + TypeScript
├── TanStack Router (type-safe routing)
├── TanStack Table (transaction display)
├── Tailwind CSS + shadcn/ui (styling)
├── Papa Parse (CSV parsing)
├── Recharts (visualizations)
├── html-to-image (shareable cards)
└── Zustand (state management - optional)
```

### Why This Stack?

1. **Vite** - Fast dev server, modern build tool
2. **TanStack Router** - Type-safe routing, file-based routes
3. **TanStack Table** - Powerful table with sorting/filtering
4. **Papa Parse** - Robust CSV parsing, handles edge cases
5. **Recharts** - React-native charts, good for wrapped visualizations
6. **shadcn/ui** - Beautiful, accessible components

### Alternatives Considered

| Option   | Reason Not Chosen                                |
| -------- | ------------------------------------------------ |
| Next.js  | Overkill for static site, adds server complexity |
| Chart.js | Less React-native than Recharts                  |
| ag-Grid  | Too heavy for this use case                      |

---

## Privacy & Compliance

### Architecture Benefits

| Concern      | Solution                                         |
| ------------ | ------------------------------------------------ |
| GDPR         | No data collection - everything stays in browser |
| Data Storage | No server-side storage, optional localStorage    |
| User Trust   | Can verify no network requests in DevTools       |
| Hosting      | Static files only - free on Vercel/Netlify       |

### Privacy Features

- All CSV parsing happens in browser
- No data sent to any server
- Optional: Clear data button
- No analytics/tracking

---

## MVP Features

### Core

1. **CSV Upload** - Drag & drop Amex CSV
2. **Transaction Table** - Sort, filter, search
3. **Wrapped Experience** - Category breakdown, top merchants, trends
4. **Export** - PNG cards for sharing

### Wrapped Stats

- Total spend
- Spend by category (pie chart)
- Top 10 merchants
- Monthly trends (line chart)
- Biggest purchase
- Most frequent merchant
- Average transaction size
- Spending streaks

---

## Future Enhancements

- Trading 212 integration
- Multi-year comparison
- Custom categories
- PDF statement parsing (for older history)
- Local persistence (IndexedDB)
- PWA support (offline use)

---

## Resources

- [Amex Developer Portal](https://developer.americanexpress.com/)
- [TanStack Router Docs](https://tanstack.com/router/latest)
- [Papa Parse Docs](https://www.papaparse.com/docs)
- [Recharts](https://recharts.org/)
- [shadcn/ui](https://ui.shadcn.com/)
