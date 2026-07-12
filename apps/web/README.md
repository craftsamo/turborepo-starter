# Web Application

## Overview

A modern web application built with Next.js. Features state management with
Redux, styling with Tailwind CSS, and comprehensive testing framework to
ensure code quality.

## 📁 Project Structure

```
src/
├── app/                     # Next.js App Router (pages and layouts)
│   ├── (app)/               # Main route group — owns page chrome
│   │   ├── _components/     # Route-local components (private folder)
│   │   ├── layout.tsx       # Screen + Header + Footer chrome
│   │   └── page.tsx         # Home page
│   ├── global-not-found.tsx # 404 document (self-contained)
│   └── layout.tsx           # Root layout (slim: Providers + Toaster)
├── components/              # Reusable components
│   └── Providers/           # State management & theme providers
├── lib/                     # Utility functions
├── middlewares/             # Next.js middleware
├── store/                   # Redux store configuration
├── tests/                   # Test files
├── types/                   # TypeScript type definitions
└── proxy.ts                 # Proxy configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **Yarn**: v1.22 or higher (package manager)
- **Git**: For version control

### Installation

1. **Install dependencies**

```bash
pnpm install
```

2. **Set up environment file**

Copy `.env.example` to `.env` and configure the required environment variables:

```bash
cp .env.example .env
```

3. **Start the development server**

```bash
nps dev.web
```

The server will start at `http://localhost:3000`.

## 🔧 Environment Variables

| Variable   | Default               | Description  |
| ---------- | --------------------- | ------------ |
| `BASE_URL` | http://localhost:3000 | API base URL |

## 📚 Available Commands

For more details, see [package-scripts](../../package-scripts.js).

## 📖 Code Style & Guidelines

For detailed code style guidelines, naming conventions, and component architecture, see:

- [CODE_STYLE.md](../../docs/instructions/CODE_STYLE.md)
