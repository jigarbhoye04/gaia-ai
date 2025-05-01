# GAIA - Your Personal AI Assistant

  <img src="public/branding/logo.webp" alt="GAIA Logo" width="150" />

## 🌟 Overview

GAIA is an advanced personal AI assistant designed to enhance productivity and streamline daily tasks. With seamless integration capabilities and intelligent features, GAIA provides a comprehensive solution for managing your digital life.

**Website:** [https://heygaia.io](https://heygaia.io)


## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [PNPM](https://pnpm.io/) (v10.10.0 or later)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/gaia-frontend.git
   cd gaia-frontend
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your API keys and configuration.

### Development

Start the development server:

```bash
# Using Turbopack (faster)
pnpm dev

# Using Webpack
pnpm dev:webpack
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

```bash
pnpm build
pnpm start
```

### Linting and Type Checking

```bash
# Check types
pnpm type

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

## 📁 Project Structure

```
src/
├── app/                   # Next.js app directory
│   ├── (landing)/        # Landing page routes
│   ├── (main)/           # Main application routes
│   └── styles/           # Global stylesheets
├── components/           # Reusable UI components
├── config/               # Configuration files
├── hooks/                # Custom React hooks
├── layouts/              # Layout components
├── lib/                  # Utility libraries
├── services/             # API services
└── types/                # TypeScript types
```