# Assistant chat UI

Design notes for the AI assistant chat (`app/components/assistant/**`). The
palette roles below are also the reference for any future colorful surface in
the app; prefer these tokens over reintroducing Tailwind's default scales.

## Palette

The app is dark-only (`<html class="dark">`) and uses the custom scale in
`app/app.css`. Two cool accents carry interaction and everything else is either
neutral or semantic:

| Role | Tokens | Where |
| --- | --- | --- |
| Primary | `indigo-*` (cyan ramp) | Send button, focus rings, active nav, links, streaming caret |
| Secondary | `violet-*` | Assistant identity (header/empty-state gradient) and "deep thinking" states |
| Success | `emerald-*` | Completed write-tool receipts, finished tool dots, "Low" reasoning |
| Warning | `amber-*` | Warnings and toasts |
| Danger | `red-*` | Failed tool calls, error banners and toasts |
| Neutral | `gray-*` | Canvas, surfaces, body text |

Guidelines:

- Keep accents desaturated; the cyan and violet ramps are already tuned for the
  near-black canvas. Do not add a third saturated hue.
- Surfaces are `gray-900/60`–`gray-900/70` glass over the `gray-950` canvas with
  a `white/[0.08]` hairline. Elevation comes from lightness, not shadows.
- Body text is `gray-200`, secondary text `gray-300`/`gray-400`. Avoid
  `gray-500` for anything a user must read; it is for metadata only.
- Meet WCAG AA (4.5:1) for text and 3:1 for icons/controls.

### Status color gotcha

`emerald`, `amber`, `red`, and `yellow` are **inverted** relative to Tailwind:
`-50` is the darkest and `-950` the lightest. For readable text on a dark
surface use the **high** numbers (`-700`–`-950`); use the low numbers only for
backgrounds/tints. `text-emerald-100` renders near-black and is a bug. (The
`indigo`/`violet`/`gray` ramps follow the normal `-50`-lightest convention.)

## Reasoning picker

`AssistantReasoningPicker` is a segmented control rather than a dropdown: with
only three levels, keeping every option visible makes the trade-off legible and
the current level obvious. Each level shows its cost in words ("Fastest
replies…", "Most thorough, slower to answer") and is tinted by depth
(emerald → cyan → violet).

- Built on native radio inputs in a `fieldset`/`legend`, so arrow keys move
  between levels and assistive tech announces a single group. The focus ring is
  drawn on the label via `has-[:focus-visible]`.
- The preference is persisted in `localStorage` and sent per message, so a
  mid-thread change applies to the next reply only.
- **Hydration:** the stored preference is applied in an effect after mount, not
  during render. Reading `localStorage` while rendering makes the server and
  client markup disagree (React hydration error #418).

## Markdown

Assistant replies render through `react-markdown` with `remark-gfm` so tables,
task lists, and strikethrough work. Prose colors are overridden by
`.assistant-prose` in `app/app.css` to match the app scale. A blinking caret is
drawn with `.assistant-prose--streaming` while a reply streams, and honors
`prefers-reduced-motion`.
