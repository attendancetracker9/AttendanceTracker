# Missing Dependencies - Installation Guide

## Problem
The application is missing required packages, causing 500 errors:
- `lucide-react` - Icon library
- `dayjs` - Date formatting library
- `recharts` - Chart library

## Solution

Run this command in the `admin-portal` directory:

```bash
npm install lucide-react dayjs recharts
```

Or if you prefer to install them individually:

```bash
npm install lucide-react
npm install dayjs
npm install recharts
```

## After Installation

1. **Restart your dev server**:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

2. **The 500 errors should be resolved** ✅

## What These Packages Do

- **lucide-react**: Provides icon components (Menu, Calendar, etc.)
- **dayjs**: Handles date formatting and manipulation
- **recharts**: Creates charts and graphs (LineChart, BarChart, etc.)

These are already added to `package.json`, you just need to install them.

