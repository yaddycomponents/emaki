import * as z from 'zod'
import {
  Align,
  Anim,
  Badge,
  Bar,
  Button,
  Checkbox,
  Chip,
  CONTAINER_KINDS,
  Count,
  Divider,
  Dot,
  Field,
  Icon,
  Image,
  Justify,
  ListRow,
  Search,
  Size,
  Sparkle,
  Tabs,
  Text,
  Toggle,
  Vector,
} from './schema'

/**
 * A node-tree error explainer. Zod's recursive `union([Leaf, Container])` reports
 * a failure at the *node* level ("…children[3] is invalid") rather than naming the
 * bad leaf + field + value. This walks the tree and validates each node against
 * its exact schema, returning the first precise problem:
 *   "root.children[3] (text): size — Invalid option: expected one of …, got 'rowLabel'"
 */

const LEAF_BY_KIND: Record<string, z.ZodType> = {
  bar: Bar,
  text: Text,
  badge: Badge,
  dot: Dot,
  icon: Icon,
  toggle: Toggle,
  count: Count,
  divider: Divider,
  image: Image,
  sparkle: Sparkle,
  vector: Vector,
  button: Button,
  checkbox: Checkbox,
  chip: Chip,
  tabs: Tabs,
  search: Search,
  field: Field,
  listRow: ListRow,
}

// A container's own props (children excluded) so a bad container field is pinpointed.
const ContainerScalar = z.object({
  kind: z.enum(CONTAINER_KINDS),
  at: z.number().optional(),
  in: z.array(z.string()).optional(),
  enter: Anim.optional(),
  exit: Anim.optional(),
  w: Size.optional(),
  gap: z.number().optional(),
  pad: z.number().optional(),
  justify: Justify.optional(),
  align: Align.optional(),
  bg: z.string().optional(),
  border: z.union([z.boolean(), z.string()]).optional(),
  radius: z.number().optional(),
  shadow: z.union([z.boolean(), z.enum(['sm', 'md', 'lg'])]).optional(),
  stagger: z.number().optional(),
})

const CONTAINER = new Set<string>(CONTAINER_KINDS)

function firstIssue(err: z.ZodError): string {
  const i = err.issues[0]!
  const field = i.path.join('.') || '(root)'
  return `${field} — ${i.message}`
}

/** The first invalid node in a tree, described precisely, or null if all valid. */
export function explainNode(node: unknown, path = 'root'): string | null {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) {
    return `${path}: expected a node object`
  }
  const kind = (node as { kind?: unknown }).kind
  if (typeof kind !== 'string') return `${path}: missing "kind"`

  if (CONTAINER.has(kind)) {
    const { children, ...scalar } = node as Record<string, unknown>
    const r = ContainerScalar.safeParse(scalar)
    if (!r.success) return `${path} (${kind}): ${firstIssue(r.error)}`
    if (!Array.isArray(children) || children.length === 0) {
      return `${path} (${kind}): children — a container needs a non-empty children[]`
    }
    for (let i = 0; i < children.length; i++) {
      const e = explainNode(children[i], `${path}.children[${i}]`)
      if (e) return e
    }
    return null
  }

  const schema = LEAF_BY_KIND[kind]
  if (!schema) {
    return `${path}: unknown kind "${kind}" — see list_blocks / describe_ui_nodes`
  }
  const r = schema.safeParse(node)
  if (!r.success) return `${path} (${kind}): ${firstIssue(r.error)}`
  return null
}
