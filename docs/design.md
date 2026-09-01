# Design System & UI Guidelines — Ayzoh Enji Trading Journal

## 1. Aesthetic Vision
- **Theme:** Clean, modern, high-contrast trading application design.
- **Color Palette:** Slate/Neutral bases (`slate-900`, `slate-800`, `slate-50`) paired with curated signal colors:
  - **Profit / Win / Success:** Emerald (`emerald-600`, `emerald-700`, `emerald-50`)
  - **Loss / Danger / Critical:** Rose (`rose-600`, `rose-700`, `rose-50`)
  - **Warning / Elevation:** Amber (`amber-500`, `amber-600`, `amber-50`)
  - **Neutral / Informational:** Blue (`blue-600`, `blue-50`)
- **Typography:** Sans-serif UI typography with high-density monospace numerical displays (`font-mono`) for metrics, prices, P&L, R-multiples, and currency values.

## 2. Component Layout Rules
- **Cards & Containers:** `bg-white p-5 rounded-lg border border-slate-200 shadow-xs`.
- **Badges & Statuses:** Micro-typography (`text-[10px] font-bold uppercase px-2 py-0.5 rounded`).
- **Input Controls:** Standardized `px-3 py-1.5 border border-slate-300 rounded text-xs font-mono`.

## 3. Interactivity & Micro-animations
- Smooth hover transitions (`transition-colors duration-150`).
- Subtle status indicators and progress bars for daily loss limits and risk exposure tracking.

## 4. Mobile & Phone Responsive Rules
- Single-column stacked layouts on mobile viewports (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- Clean touch targets for mobile trade logging and checklist checking.
