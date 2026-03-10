# Esperanza — Design System

## Color Palette

Earthy warm tones — welcoming, nature-inspired, accessible.

| Token | Hex | Usage |
|---|---|---|
| `--primary` | `#B7714A` | Terracotta — buttons, active states, links |
| `--primary-dark` | `#9A5C3A` | Hover states |
| `--primary-light` | `#D4956F` | Subtle highlights |
| `--secondary` | `#7C9070` | Sage green — secondary actions, success |
| `--secondary-dark` | `#64785A` | Hover states |
| `--accent` | `#D4A853` | Warm gold — badges, highlights, CTAs |
| `--accent-dark` | `#B8922F` | Hover states |
| `--bg` | `#FAF7F2` | Page background (warm cream) |
| `--surface` | `#FFFFFF` | Cards, modals |
| `--surface-hover` | `#F5F0E8` | Hovered cards |
| `--text` | `#2C1810` | Primary text (dark warm brown) |
| `--text-secondary` | `#6B5C52` | Secondary text |
| `--border` | `#E8E0D8` | Borders, dividers |
| `--success` | `#7C9070` | Same as secondary |
| `--danger` | `#C44A4A` | Errors, destructive actions |
| `--warning` | `#D4A853` | Same as accent |

## Typography

**Font:** Inter (Google Fonts) — already configured in `globals.css`.

## Icons

**Library:** [Lucide React](https://lucide.dev/) (`lucide-react`)

Usage:
```tsx
import { Home, Calendar, User } from "lucide-react";
<Home size={20} />
```

Consistent sizing across the app:
- Navigation: `size={20}`
- Inline with text: `size={16}`
- Hero/empty states: `size={48}`

## UI Components

**Library:** [shadcn/ui](https://ui.shadcn.com/) (copy-paste model, built on Radix UI + Tailwind)

Components are installed into `src/components/ui/` and fully owned by the team.

Install new components with:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
```

## User Roles & Default Pages

| Role | Default Page | Description |
|---|---|---|
| `USER` | `/` | Resident dashboard |
| `PROVIDER` | `/provider` | Service provider dashboard |
| `ADMIN` | `/admin` | Admin dashboard |
