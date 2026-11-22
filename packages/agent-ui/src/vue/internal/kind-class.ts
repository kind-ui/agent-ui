import {
  type Component,
  cloneVNode,
  defineComponent,
  Fragment,
  h,
  isVNode,
  type Slots,
  type VNode,
} from "vue";

type RenderSlot = (scope: Record<string, unknown>) => VNode[];

const bareParts = new WeakMap<object, Component>();

// A Kind part rendered as another (`<KindToolbarButton>` whose `#render` slot holds a `<KindMenuTrigger>`) renders
// the target's bare UI SDK part, so the element gets the outer base classes once instead of both lists.
function bareNodes(nodes: VNode[]): VNode[] {
  return nodes.map((node) => {
    if (!isVNode(node)) return node;
    if (node.type === Fragment && Array.isArray(node.children))
      return h(Fragment, { key: node.key ?? undefined }, bareNodes(node.children as VNode[]));
    const bare = bareParts.get(node.type as object);
    if (!bare) return node;
    // A clone keeps the node's directives (`v-show`), transition, key and ref.
    const clone = cloneVNode(node);
    clone.type = bare;
    clone.children = bareSlots(node.children as Slots | null);
    return clone;
  });
}

function bareSlots(slots: Slots | null): Slots | null {
  const render = slots?.render as RenderSlot | undefined;
  if (!render) return slots;
  return { ...slots, render: (scope: Record<string, unknown>) => bareNodes(render(scope)) };
}

/**
 * Passes a UI SDK part through with Kind's classes before the caller's `class`. Vue binds `class` as a string, an
 * array or an object, never a function of the part's state: style state through `data-*` attributes.
 */
export function withKindClass<C extends Component>(component: C, base: string, name: string): C {
  const Kind = defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(component, { ...attrs, class: [base, attrs.class] }, bareSlots(slots) ?? undefined);
    },
  });
  bareParts.set(Kind, component);
  return Kind as unknown as C;
}
