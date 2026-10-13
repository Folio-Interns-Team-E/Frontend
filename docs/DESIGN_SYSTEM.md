# SalesSync enterprise design system

This system is optimized for dense, daily-use sales workflows. It favors clarity, hierarchy, and predictable interaction over decorative effects.

## Foundations

### Color

| Role           | Token                | Value     | Reason                                                                                 |
| -------------- | -------------------- | --------- | -------------------------------------------------------------------------------------- |
| App background | `background`         | `#F6F7F9` | Quiet neutral canvas that separates white work surfaces without tinting data.          |
| Surface        | `surface`            | `#FFFFFF` | Keeps tables, forms, and panels crisp and familiar.                                    |
| Primary text   | `on-surface`         | `#172033` | High contrast without pure-black harshness.                                            |
| Secondary text | `on-surface-variant` | `#475569` | Readable supporting text at compact sizes.                                             |
| Border         | `outline-variant`    | `#CBD5E1` | Structure through borders instead of heavy shadows.                                    |
| Brand/primary  | `primary`            | `#2563EB` | Familiar, confident enterprise blue used only for actions, focus, and selected states. |
| Success        | `success`            | `#067647` | Muted green for completed/won/healthy states.                                          |
| Warning        | `warning`            | `#B54708` | Muted amber for attention and elapsed states.                                          |
| Danger         | `error`              | `#B42318` | Reserved for destructive actions and failures.                                         |
| Info           | `info`               | `#175CD3` | Informational states distinct from interactive blue when required.                     |

Text/background combinations are selected to meet WCAG AA for normal interface text. Never use semantic color as the only carrier of meaning; pair it with a label or icon.

### Typography

- Family: Inter with system sans-serif fallback. It is neutral, compact, and highly legible in tables.
- Display: 28/36, weight 600.
- Page title: 18/25, weight 600.
- Body: 13/19, weight 400.
- Label: 12/16, weight 600.
- Eyebrow/table header: 11/16, weight 600, modest uppercase tracking.
- Figures, currency, dates, tables, and timestamps use tabular numerals.
- Functional UI does not use decorative fonts or weights above 700.

### Spacing and layout

- Base spacing unit: 4px.
- Common steps: 4, 8, 12, 16, 24, 32px.
- Page padding: 24px desktop, 16px mobile.
- Sidebar: 240px; assistant panel: 340px.
- Dense tables and lists use 12–16px vertical row padding; large empty decorative cards are avoided.

### Shape and elevation

- Controls and compact cards: 6px radius.
- Main panels and modals: 8px radius.
- Status badges may remain pill-shaped because the shape communicates a compact state.
- Default elevation: 0 1px 2px at 4% black.
- Dropdown/modal elevation: one restrained medium shadow. Panels do not float or animate upward.

## Components

### Actions

- Primary: solid blue, for one dominant action per area.
- Secondary: white with neutral border.
- Tertiary: text action with a neutral hover fill.
- Destructive: solid muted red and explicit destructive copy.
- All actions use 38px default minimum height, 6px radius, visible focus rings, disabled opacity, and no gradients.

### Inputs

Inputs, selects, textareas, and compound search controls use a white background, neutral border, 38px minimum height, and a blue focus ring. Placeholder text is secondary, never lighter than needed for readability.

### Panels, tables, and pipeline cards

Panels use white surfaces, 1px borders, and minimal elevation. Tables use a subtle neutral header and hover row. Pipeline columns use a gray canvas; deal cards stay white and do not lift on hover. KPI values use tabular numerals and should remain compact enough to preserve context above the fold.

### Navigation and assistant

The sidebar uses a stable slate surface, neutral navigation labels, and one blue selected indicator. The assistant is visually subordinate to the primary workspace and uses bordered message blocks rather than playful chat bubbles.

### Charts

Charts should use brand blue as the primary series, slate for comparison, and semantic colors only for status meaning. Use direct labels or clear legends, subtle grid lines, no gradients, glows, 3D effects, or unlabeled decorative shapes.

## Usage rules

1. Prefer shared classes (`primary-action`, `secondary-action`, `control`, `section-panel`, `table-shell`, `metric-card`, `status-badge`) over one-off styles.
2. Use semantic tokens rather than raw colors for new components.
3. Do not introduce gradients, glow effects, glassmorphism, hover translation, or radii above 8px for functional UI.
4. Preserve keyboard navigation, visible focus, reduced-motion behavior, labels, and accessible contrast.
