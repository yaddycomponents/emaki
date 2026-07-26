import * as z from 'zod'

/**
 * UI scenes as data — a *constrained* mock language, not arbitrary UI. The
 * vocabulary is exactly what v1's InboxScene/DetailScene actually used:
 * panes, rows, shimmer bars, a handful of literal labels. Every node is
 * expressible as data; a freeform paragraph is not, and deliberately isn't here.
 */

export const Size = z.union([z.number(), z.string()]).meta({ description: '380 | "52%" | "1fr"' })

const base = {
  /** Optional nudge on the derived reveal time, in seconds. */
  at: z.number().optional(),
  /** Render only in these states (omit = all). e.g. an "Activity created" card that only exists once loaded. */
  in: z.array(z.string()).optional(),
}

/** The UI type ramp — deliberately small (11–28px), decoupled from the slide scale. */
export const TextSize = z.enum(['eyebrow', 'label', 'body', 'md', 'lg', 'metric', 'h2'])

// ── leaves ───────────────────────────────────────────────────────────────────
export const Bar = z.object({
  ...base,
  kind: z.literal('bar'),
  w: Size.default('100%'),
  h: z.number().default(9),
  lite: z.boolean().default(false),
  /** If present, this bar becomes real text once the deck reaches a loaded state. */
  text: z.string().optional(),
  /** Type size when it becomes text — decoupled from `h` (the shimmer height). */
  size: TextSize.default('body'),
})

export const Text = z.object({
  ...base,
  kind: z.literal('text'),
  value: z.string().min(1),
  tone: z.enum(['ink', 'muted', 'faint', 'primary', 'good', 'danger']).default('ink'),
  size: TextSize.default('body'),
  mono: z.boolean().default(false),
  weight: z.enum(['regular', 'medium', 'bold']).default('regular'),
})

export const Badge = z.object({
  ...base,
  kind: z.literal('badge'),
  label: z.string().min(1),
  tone: z.enum(['ai', 'good', 'danger', 'muted']).default('ai'),
  /** Arbitrary accent (hex) — overrides `tone`. e.g. a coloured label chip. */
  color: z.string().optional(),
})

export const Dot = z.object({
  ...base,
  kind: z.literal('dot'),
  size: z.number().default(34),
  initials: z.string().max(2).optional(),
  /** Arbitrary colour (hex) — overrides the accent. e.g. per-label status dots. */
  color: z.string().optional(),
})

/** The icon allowlist — resolved to a drawn glyph by the renderer. `list_icons` returns these. */
export const ICON_NAMES = [
  'search',
  'plus',
  'minus',
  'check',
  'x',
  'chevron-right',
  'chevron-down',
  'chevron-left',
  'arrow-right',
  'mail',
  'calendar',
  'clock',
  'bell',
  'star',
  'user',
  'filter',
  'settings',
  'more-horizontal',
] as const

export const Icon = z.object({
  ...base,
  kind: z.literal('icon'),
  name: z.enum(ICON_NAMES).meta({ description: 'One of the icon allowlist — see list_icons.' }),
  tone: z.enum(['ink', 'muted', 'primary', 'good', 'danger']).default('muted'),
  /** Arbitrary colour (hex) — overrides `tone`. */
  color: z.string().optional(),
})

export const Toggle = z.object({ ...base, kind: z.literal('toggle'), on: z.boolean().default(true) })

export const Count = z.object({
  ...base,
  kind: z.literal('count'),
  to: z.number(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
})

export const Divider = z.object({ ...base, kind: z.literal('divider') })

export const Image = z.object({
  ...base,
  kind: z.literal('image'),
  src: z
    .string()
    .min(1)
    .meta({
      description:
        'A local path (resolved relative to the deck file and inlined at render), a data: URI, or an https URL. Use for a real logo or screenshot.',
    }),
  w: Size.optional(),
  h: Size.optional(),
  fit: z.enum(['cover', 'contain']).default('contain'),
  radius: z.number().default(0),
  alt: z.string().optional(),
})

// ── product-UI primitives ────────────────────────────────────────────────────
export const Button = z.object({
  ...base,
  kind: z.literal('button'),
  label: z.string().min(1),
  variant: z.enum(['filled', 'outline', 'ghost']).default('filled'),
  color: z.string().optional(),
  icon: z.enum(ICON_NAMES).optional(),
})

export const Checkbox = z.object({
  ...base,
  kind: z.literal('checkbox'),
  checked: z.boolean().default(false),
  label: z.string().optional(),
})

export const Chip = z.object({
  ...base,
  kind: z.literal('chip'),
  label: z.string().min(1),
  active: z.boolean().default(false),
  color: z.string().optional(),
})

export const Tabs = z.object({
  ...base,
  kind: z.literal('tabs'),
  items: z.array(z.string().min(1)).min(1),
  active: z.number().int().default(0),
})

export const Search = z.object({
  ...base,
  kind: z.literal('search'),
  placeholder: z.string().default('Search'),
})

// composites — the two patterns v1 repeated most
export const Field = z.object({
  ...base,
  kind: z.literal('field'),
  label: z.string(),
  value: z.union([z.string(), Bar]),
})

export const ListRow = z.object({
  ...base,
  kind: z.literal('listRow'),
  titleText: z.string().optional(),
  title: Size.optional(),
  /** Real subtitle text (subject/preview/company). Falls back to `sub` shimmer if absent. */
  subText: z.string().optional(),
  sub: Size.optional(),
  badge: z.string().optional(),
  active: z.boolean().default(false),
  avatar: z.boolean().default(true),
})

export const Leaf = z.discriminatedUnion('kind', [
  Bar,
  Text,
  Badge,
  Dot,
  Icon,
  Toggle,
  Count,
  Divider,
  Image,
  Button,
  Checkbox,
  Chip,
  Tabs,
  Search,
  Field,
  ListRow,
])
export type LeafNode = z.infer<typeof Leaf>

/** The leaf node kinds, in declared order — the enumerable half of the vocabulary. */
export const LEAF_KINDS = [
  'bar',
  'text',
  'badge',
  'dot',
  'icon',
  'toggle',
  'count',
  'divider',
  'image',
  'button',
  'checkbox',
  'chip',
  'tabs',
  'search',
  'field',
  'listRow',
] as const

// ── recursive containers ─────────────────────────────────────────────────────
export const CONTAINER_KINDS = ['row', 'col', 'panel', 'split', 'card'] as const

/** Main-axis packing (justify) — defaults to `start`, never space-between. */
export const Justify = z.enum(['start', 'center', 'end', 'between'])
/** Cross-axis alignment (align) — rows default to `center`, columns to `stretch`. */
export const Align = z.enum(['start', 'center', 'end', 'stretch'])

export interface ContainerNode {
  kind: (typeof CONTAINER_KINDS)[number]
  at?: number
  in?: string[]
  w?: number | string
  gap?: number
  pad?: number
  /** Main-axis packing. Default `start`. */
  justify?: 'start' | 'center' | 'end' | 'between'
  /** Cross-axis alignment. Default: row `center`, col `stretch`. */
  align?: 'start' | 'center' | 'end' | 'stretch'
  /** Stagger between this container's children, in seconds. */
  stagger?: number
  children: UiNode[]
}

export type UiNode = LeafNode | ContainerNode

export const Container: z.ZodType<ContainerNode> = z.lazy(() =>
  z
    .object({
      kind: z.enum(CONTAINER_KINDS),
      at: z.number().optional(),
      in: z.array(z.string()).optional(),
      w: Size.optional(),
      gap: z.number().optional(),
      pad: z.number().optional(),
      justify: Justify.optional(),
      align: Align.optional(),
      stagger: z.number().optional(),
      children: z.array(UiNode).min(1),
    })
    .meta({ id: 'UiContainer' }),
)

export const UiNode: z.ZodType<UiNode> = z.union([Leaf, Container]).meta({ id: 'UiNode' })

export const State = z.object({
  id: z.string(),
  hold: z.number().positive().default(1.5),
})
export type State = z.infer<typeof State>

/** The `ui-scene` block's props. Hosted behind one block type in @emaki/blocks. */
export const uiSceneProps = z.object({
  /** Frame around the mock: `app` (top bar + nav rail), `window` (title bar), or `none`. */
  chrome: z.enum(['app', 'window', 'none']).default('none'),
  /** App/window name shown in the chrome title bar. */
  title: z.string().optional(),
  /** The line under the mock (v1's <Caption>). */
  caption: z.string().optional(),
  /** Timeline of states with holds — skeleton → loaded, etc. */
  states: z
    .array(State)
    .min(1)
    .default([{ id: 'loaded', hold: 2.5 }]),
  /** How state changes read: `crossfade` (dissolve) or `cut` (hard swap). */
  transition: z.enum(['crossfade', 'cut']).default('crossfade'),
  /** Crossfade duration at each state boundary, in ms. */
  transitionMs: z.number().default(420),
  root: Container,
})
export type UiSceneProps = z.infer<typeof uiSceneProps>
