/* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any */
import type { Token, TW, Context } from '../types'

import { tw as defaultTW, hash } from '../index'

export interface Pragma<HResult = any> {
  (type: any, props: {}, ...children: any[]): HResult
}

export interface BaseProps {
  class?: string
  className?: string
}

export type PropsWithBaseProps<P> = P & BaseProps

export type PropsWithAs<P> = P & { as?: Tag | StyledComponent }

export type PropsWithChildren<P> = P & { children?: any }

export type PropsWithRef<P> = P & { ref?: any }

export interface MutableRefObject<T> {
  current: T
}

export type ForwardedRef<T> = ((instance: T | null) => void) | MutableRefObject<T | null> | null

export interface ForwardRefRenderFunction<T, P = {}> {
  (props: PropsWithChildren<P>, ref: ForwardedRef<T>): any
  displayName?: string
  // explicit rejected with `never` required due to
  // https://github.com/microsoft/TypeScript/issues/36826
  /**
   * defaultProps are not supported on render functions
   */
  defaultProps?: never
}

export interface ForwardRef {
  <T, P = {}>(render: ForwardRefRenderFunction<T, P>): StyledComponent<P, T>
}

export interface StyledComponent<P = {}, T = never, HResult = any> {
  (props: PropsWithChildren<PropsWithAs<PropsWithBaseProps<P>>>, ref?: ForwardedRef<T>): HResult
  // propTypes?: WeakValidationMap<P>;
  // contextTypes?: ValidationMap<any>;
  defaultProps?: Partial<PropsWithAs<PropsWithBaseProps<P>>>
  displayName?: string

  /**
   * Returns the marker class as a selector: `.tw-xxx`
   */
  toString(): string
}

export interface StyleFactory<P = {}> {
  (props: P, context: Context): Token
}

export interface PartialStyledComponent<P = {}, T = never, HResult = any> {
  <A extends P>(factory: StyleFactory<P>): StyledComponent<A, T, HResult>

  <A extends P>(
    strings: TemplateStringsArray,
    ...interpolations: (Token | StyleFactory<A>)[]
  ): StyledComponent<P, A, HResult>

  <A extends P>(...tokens: (Token | StyleFactory<A>)[]): StyledComponent<P, A, HResult>
}

export interface StyledTag {
  <P = {}, T = never, HResult = any>(
    this: StyledContext<HResult> | Pragma<HResult> | null | undefined | void,
    strings: TemplateStringsArray,
    ...interpolations: (Token | StyleFactory<P>)[]
  ): StyledComponent<P, T, HResult>

  <P = {}, T = never, HResult = any>(
    this: StyledContext<HResult> | Pragma<HResult> | null | undefined | void,
    token: Token | StyleFactory<P>,
    ...tokens: (Token | StyleFactory<P>)[]
  ): StyledComponent<P, T, HResult>
}

export interface BoundStyledTag<HResult = any> {
  <P = {}, T = never>(
    strings: TemplateStringsArray,
    ...interpolations: (Token | StyleFactory<P>)[]
  ): StyledComponent<P, T, HResult>

  <P = {}, T = never>(
    token: Token | StyleFactory<P>,
    ...tokens: (Token | StyleFactory<P>)[]
  ): StyledComponent<P, T, HResult>
}

export interface BoundStyled<HResult = any> {
  <P = {}, T = never>(tag: Tag): PartialStyledComponent<P, T, HResult>

  <P = {}, A extends P = P, T = never>(tag: StyledComponent<P, T, HResult>): PartialStyledComponent<
    A,
    T,
    HResult
  >

  <P = {}, T = never>(
    tag: Tag,
    token: Token | StyleFactory<P>,
    ...tokens: Token[]
  ): StyledComponent<P, T, HResult>

  <P = {}, A extends P = P, T = never>(
    tag: StyledComponent<P, T, HResult>,
    token: Token | StyleFactory<A>,
    ...tokens: Token[]
  ): StyledComponent<A, T, HResult>
}

export interface Styled {
  <P = {}, T = never, HResult = never>(
    this: StyledContext<HResult> | Pragma<HResult> | null | undefined | void,
    tag: Tag,
  ): PartialStyledComponent<P, T, HResult>

  <P = {}, A extends P = P, T = never, HResult = never>(
    this: StyledContext<HResult> | Pragma<HResult> | null | undefined | void,
    tag: StyledComponent<P, T, HResult>,
  ): PartialStyledComponent<A, T, HResult>

  <P = {}, T = never, HResult = never>(
    this: StyledContext<HResult> | Pragma<HResult> | null | undefined | void,
    tag: Tag,
    token: Token | StyleFactory<P>,
    ...tokens: (Token | StyleFactory<P>)[]
  ): StyledComponent<P, T, HResult>

  <P = {}, A extends P = P, T = never, HResult = never>(
    this: StyledContext<HResult> | Pragma<HResult> | null | undefined | void,
    tag: StyledComponent<P, T, HResult>,
    token: Token | StyleFactory<A>,
    ...tokens: (Token | StyleFactory<A>)[]
  ): StyledComponent<P, T, HResult>

  bind<HResult>(context: StyledContext<HResult>): WithTags<BoundStyled<HResult>>
  bind<HResult>(h: Pragma<HResult>, tw?: TW): WithTags<BoundStyled<HResult>>
}

export interface StyledContext<HResult = any> {
  createElement: Pragma<HResult>
  forwardRef?: ForwardRef
  tw?: TW
}

const contextCache = new WeakMap<TW, Context>()

const getContext = (tw: TW): Context => {
  let context = contextCache.get(tw)

  if (!context) {
    tw((_) => {
      context = _
      return ''
    })

    contextCache.set(tw, (context as unknown) as Context)
  }

  return context as Context
}

const ESCAPE = {} as const
const detectInlinePlugins: ProxyHandler<{}> = {
  get(target, prop, receiver) {
    if (!Reflect.has(target, prop) && ~['tw', 'theme', 'tag'].indexOf(prop as string)) {
      throw ESCAPE
    }

    return Reflect.get(target, prop, receiver)
  },
}

const build = <P = {}>(tw: TW, tokens: unknown[]): ((props: P) => string) => {
  if (tokens.some((token) => typeof token === 'function')) {
    const interpolations = tokens.map((token) => {
      if (typeof token === 'function') {
        // If this function uses tw, theme or tag it is most likely an inline plugin
        // and we keep it as is
        // Otherwise it maybe just a string interpolation
        return (props: P, context: Context): Token => {
          if (token.length > 1) {
            // (props, { tw }) => tw`...`
            return (context) => token(props, context)
          }

          try {
            return token(props, context)
          } catch (error) {
            if (error === ESCAPE) {
              return token as Token
            }

            throw error
          }
        }
      }

      return () => token as Token
    })

    return (props) => {
      const proxy = new Proxy(props, detectInlinePlugins) as P
      const context = getContext(tw)

      return tw(...interpolations.map((fn) => fn(proxy, context)))
    }
  }

  // Static styles => invoke tw only once
  let result: string

  return () => result || (result = tw(tokens as Token[]))
}

const stringifyFunctions = (key: string, value: any): unknown => {
  if (typeof value === 'function') {
    return {
      t: 'function',
      n: value.name,
      d: value.displayName,
      s: typeof value.toJSON === 'function' ? value.toJSON() : value.toString(),
    }
  }

  return value
}

const create = <P = {}, HResult = any>(
  { createElement, forwardRef, tw = defaultTW }: StyledContext<HResult>,
  tag: Tag | StyledComponent<P>,
  tokens: unknown[],
): StyledComponent<P, HResult> => {
  const targetClassName = hash(JSON.stringify([tag, tokens], stringifyFunctions))

  const evaluate = build(tw, tokens)

  const forwardAsProp = typeof tag === 'function'

  let Styled: StyledComponent<P, HResult> = ({ as = tag, class: className, ...props }, ref) => {
    // eslint-disable-next-line @typescript-eslint/no-extra-semi
    ;(props as PropsWithBaseProps<P>).className = [
      className,
      props.className,
      targetClassName,
      evaluate(props),
    ]
      .filter(Boolean)
      .join(' ')

    // If forwardRef is defined we have the ref
    if (forwardRef) {
      // eslint-disable-next-line @typescript-eslint/no-extra-semi
      ;(props as PropsWithRef<P>).ref = ref
    }

    if (forwardAsProp) {
      // eslint-disable-next-line @typescript-eslint/no-extra-semi
      ;(props as PropsWithAs<any>).as = as
      as = tag
    }

    return createElement(as, props)
  }

  Styled.displayName = `Styled(${
    (typeof tag === 'function' ? tag.displayName || tag.name : tag) || 'Component'
  })`

  if (typeof tag === 'function') {
    Styled.defaultProps = tag.defaultProps
  }

  if (forwardRef) {
    Styled = forwardRef(Styled as any)
  }

  const toString = () => `.${targetClassName}`

  Object.defineProperties(Styled, {
    toString: { value: toString },
    toJSON: { value: toString },
  })

  return Styled
}

let styledContext: StyledContext = {
  createElement: (): never => {
    throw new Error('Missing createElement. Call setup or bind before styled.')
  },

  tw: defaultTW,
}

const createStyledContext = <HResult = any>(
  context: StyledContext<HResult> | Pragma<HResult>,
  tw = styledContext.tw,
): StyledContext<HResult> => ({
  tw,
  ...(typeof context === 'function' ? { createElement: context } : context),
})

export const bind = (context: StyledContext | Pragma, tw?: TW): void => {
  styledContext = { ...styledContext, ...createStyledContext(context, tw) }
}

export type WithTags<T extends Styled | BoundStyled> = T &
  {
    readonly [P in keyof Tags]: T extends BoundStyled<infer HResult>
      ? BoundStyledTag<HResult>
      : StyledTag
  }

const tagHandler: ProxyHandler<Styled | BoundStyled> = {
  get(target, tag, receiver) {
    if (typeof tag !== 'string' || tag === 'bind') {
      return Reflect.get(target, tag, receiver)
    }

    return function (this: any, ...args: any[]) {
      return target.call(this || (receiver === target ? undefined : receiver), tag as any, ...args)
    }
  },
}
const withTags = <T extends Styled | BoundStyled>(
  styled: T,
): WithTags<T> => new Proxy(styled, tagHandler) as any

export const styled = withTags(function <HResult = any>(
  this: StyledContext<HResult> | Pragma<HResult> | null | undefined | void,
  tag: Tag | StyledComponent,
  ...tokens: unknown[]
) {
  const context = this ? createStyledContext(this) : styledContext

  return tokens.length
    ? create(context, tag, tokens)
    : (...tokens: unknown[]) => create(context, tag, tokens)
} as Styled)

styled.bind = function <HResult>(
  context: StyledContext<HResult> | Pragma<HResult>,
  tw?: TW,
): WithTags<BoundStyled<HResult>> {
  return withTags(
    Function.prototype.bind.call(styled, createStyledContext(context, tw)) as BoundStyled<HResult>,
  )
}

// const x = styled.bind(() => null)
// const Button = x('div', (props, { tw }) => tw`flex flex-${props.column ? 'col' : 'row'}`)
// const Button = x('div', (props) => [])

/** Expose as an interface to allow extensions by client packages */
export interface Tags {
  a: true
  abbr: true
  address: true
  area: true
  article: true
  aside: true
  audio: true
  b: true
  base: true
  bdi: true
  bdo: true
  big: true
  blockquote: true
  body: true
  br: true
  button: true
  canvas: true
  caption: true
  cite: true
  code: true
  col: true
  colgroup: true
  data: true
  datalist: true
  dd: true
  del: true
  details: true
  dfn: true
  dialog: true
  div: true
  dl: true
  dt: true
  em: true
  embed: true
  fieldset: true
  figcaption: true
  figure: true
  footer: true
  form: true
  h1: true
  h2: true
  h3: true
  h4: true
  h5: true
  h6: true
  head: true
  header: true
  hgroup: true
  hr: true
  html: true
  i: true
  iframe: true
  img: true
  input: true
  ins: true
  kbd: true
  keygen: true
  label: true
  legend: true
  li: true
  link: true
  main: true
  map: true
  mark: true
  marquee: true
  menu: true
  menuitem: true
  meta: true
  meter: true
  nav: true
  noscript: true
  object: true
  ol: true
  optgroup: true
  option: true
  output: true
  p: true
  param: true
  picture: true
  pre: true
  progress: true
  q: true
  rp: true
  rt: true
  ruby: true
  s: true
  samp: true
  script: true
  section: true
  select: true
  small: true
  source: true
  span: true
  strong: true
  style: true
  sub: true
  summary: true
  sup: true
  table: true
  tbody: true
  td: true
  textarea: true
  tfoot: true
  th: true
  thead: true
  time: true
  title: true
  tr: true
  track: true
  u: true
  ul: true
  var: true
  video: true
  wbr: true

  // SVG
  circle: true
  clipPath: true
  defs: true
  ellipse: true
  foreignObject: true
  g: true
  image: true
  line: true
  linearGradient: true
  mask: true
  path: true
  pattern: true
  polygon: true
  polyline: true
  radialGradient: true
  rect: true
  stop: true
  svg: true
  text: true
  tspan: true
}

export type Tag = keyof Tags
/* eslint-enable @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any */
