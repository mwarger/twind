import { suite } from 'uvu'
import * as assert from 'uvu/assert'

import type { Instance, VirtualInjector } from '../types'
import type { BoundStyled, WithTags } from './index'

import { create, virtualInjector, strict } from '../index'
import { css } from '../css/index'
import { styled } from './index'

interface Result {
  type: unknown
  props: Record<string, unknown>
  children: unknown[]
}

const test = suite<{
  injector: VirtualInjector
  tw: Instance['tw']
  styled: WithTags<BoundStyled<Result>>
}>('styled')

test.before.each((context) => {
  context.injector = virtualInjector()
  const instance = create({
    injector: context.injector,
    mode: strict,
    preflight: false,
    hash: false,
    prefix: false,
  })
  context.tw = instance.tw
  context.styled = styled.bind({
    createElement: (type, props, ...children) => ({ type, props, children }),
    tw: instance.tw,
  })
})

test('styled with template literal', ({ styled, injector }) => {
  const H1 = styled('h1')`text-5xl font-bold`

  assert.is(H1.displayName, 'Styled(h1)')
  assert.is(H1.toString(), '.tw-1ywwrkz')

  // Nothing injected yet
  assert.equal(injector.target, [])

  assert.equal(H1({}), {
    type: 'h1',
    props: { className: 'tw-1ywwrkz text-5xl font-bold' },
    children: [],
  })
  assert.equal(injector.target, [
    '.text-5xl{font-size:3rem;line-height:1}',
    '.font-bold{font-weight:700}',
  ])
})

test('tag with template literal', ({ styled, injector }) => {
  const H1 = styled.h1`text-5xl font-bold`

  assert.is(H1.displayName, 'Styled(h1)')
  assert.is(H1.toString(), '.tw-1ywwrkz')

  // Nothing injected yet
  assert.equal(injector.target, [])

  assert.equal(H1({}), {
    type: 'h1',
    props: { className: 'tw-1ywwrkz text-5xl font-bold' },
    children: [],
  })
  assert.equal(injector.target, [
    '.text-5xl{font-size:3rem;line-height:1}',
    '.font-bold{font-weight:700}',
  ])
})

test('styled with css', ({ styled, injector }) => {
  const H2 = styled('h2', [css({ fontSize: '2rem' })])

  assert.is(H2.displayName, 'Styled(h2)')
  assert.is(H2.toString(), '.tw-i5u5nc')

  // Nothing injected yet
  assert.equal(injector.target, [])

  assert.equal(H2({}), {
    type: 'h2',
    props: { className: 'tw-i5u5nc tw-1dgs2lc' },
    children: [],
  })
  assert.equal(injector.target, ['.tw-1dgs2lc{font-size:2rem}'])
})

test('tag with css', ({ styled, injector }) => {
  const H2 = styled.h2<unknown>(css({ fontSize: '2rem' }))

  assert.is(H2.displayName, 'Styled(h2)')
  assert.is(H2.toString(), '.tw-5ndwec')

  // Nothing injected yet
  assert.equal(injector.target, [])

  assert.equal(H2({}), {
    type: 'h2',
    props: { className: 'tw-5ndwec tw-1dgs2lc' },
    children: [],
  })
  assert.equal(injector.target, ['.tw-1dgs2lc{font-size:2rem}'])
})

test('styled with props', ({ styled, injector }) => {
  const Btn = styled('button', (props: { primary?: boolean }) => [
    props.primary ? 'text(purple-600)' : 'text(indigo-500)',
  ])

  assert.is(Btn.displayName, 'Styled(button)')
  assert.is(Btn.toString(), '.tw-svc8u5')

  // Nothing injected yet
  assert.equal(injector.target, [])

  assert.equal(Btn({}), {
    type: 'button',
    props: { className: 'tw-svc8u5 text-indigo-500' },
    children: [],
  })
  assert.equal(injector.target, [
    '.text-indigo-500{--tw-text-opacity:1;color:#6366f1;color:rgba(99,102,241,var(--tw-text-opacity))}',
  ])

  assert.equal(Btn({ primary: true }), {
    type: 'button',
    props: { primary: true, className: 'tw-svc8u5 text-purple-600' },
    children: [],
  })
  assert.equal(injector.target, [
    '.text-indigo-500{--tw-text-opacity:1;color:#6366f1;color:rgba(99,102,241,var(--tw-text-opacity))}',
    '.text-purple-600{--tw-text-opacity:1;color:#7c3aed;color:rgba(124,58,237,var(--tw-text-opacity))}',
  ])
})

test('tag with props', ({ styled, injector }) => {
  const Btn = styled.button((props: { primary?: boolean }) => [
    props.primary ? 'text(purple-600)' : 'text(indigo-500)',
  ])

  assert.is(Btn.displayName, 'Styled(button)')
  assert.is(Btn.toString(), '.tw-svc8u5')

  // Nothing injected yet
  assert.equal(injector.target, [])

  assert.equal(Btn({}), {
    type: 'button',
    props: { className: 'tw-svc8u5 text-indigo-500' },
    children: [],
  })
  assert.equal(injector.target, [
    '.text-indigo-500{--tw-text-opacity:1;color:#6366f1;color:rgba(99,102,241,var(--tw-text-opacity))}',
  ])

  assert.equal(Btn({ primary: true }), {
    type: 'button',
    props: { primary: true, className: 'tw-svc8u5 text-purple-600' },
    children: [],
  })
  assert.equal(injector.target, [
    '.text-indigo-500{--tw-text-opacity:1;color:#6366f1;color:rgba(99,102,241,var(--tw-text-opacity))}',
    '.text-purple-600{--tw-text-opacity:1;color:#7c3aed;color:rgba(124,58,237,var(--tw-text-opacity))}',
  ])
})

test('tag with inline prop', ({ styled, injector }) => {
  const Btn = styled.button`
    text-${(props: { primary?: boolean }) => (props.primary ? 'purple-600' : 'indigo-500')}
    sm:${css({
      border: '1px dashed darkgreen',
    })}
  `

  assert.is(Btn.displayName, 'Styled(button)')
  assert.is(Btn.toString(), '.tw-1l2r3m7')

  // Nothing injected yet
  assert.equal(injector.target, [])

  assert.equal(Btn({}), {
    type: 'button',
    props: { className: 'tw-1l2r3m7 text-indigo-500 sm:tw-rzyaiu' },
    children: [],
  })
  assert.equal(injector.target, [
    '.text-indigo-500{--tw-text-opacity:1;color:#6366f1;color:rgba(99,102,241,var(--tw-text-opacity))}',
    '@media (min-width: 640px){.sm\\:tw-rzyaiu{border:1px dashed darkgreen}}',
  ])

  assert.equal(Btn({ primary: true }), {
    type: 'button',
    props: { primary: true, className: 'tw-1l2r3m7 text-purple-600 sm:tw-rzyaiu' },
    children: [],
  })
  assert.equal(injector.target, [
    '.text-indigo-500{--tw-text-opacity:1;color:#6366f1;color:rgba(99,102,241,var(--tw-text-opacity))}',
    '.text-purple-600{--tw-text-opacity:1;color:#7c3aed;color:rgba(124,58,237,var(--tw-text-opacity))}',
    '@media (min-width: 640px){.sm\\:tw-rzyaiu{border:1px dashed darkgreen}}',
  ])
})

test('styled with props using tw', ({ styled, injector }) => {
  const Btn = styled<{ primary?: boolean }>(
    'button',
    (props, { tw }) => tw`text-${props.primary ? 'purple-600' : 'indigo-500'}`,
  )

  assert.is(Btn.displayName, 'Styled(button)')
  assert.is(Btn.toString(), '.tw-luezaj')

  // Nothing injected yet
  assert.equal(injector.target, [])

  assert.equal(Btn({}), {
    type: 'button',
    props: { className: 'tw-luezaj text-indigo-500' },
    children: [],
  })
  assert.equal(injector.target, [
    '.text-indigo-500{--tw-text-opacity:1;color:#6366f1;color:rgba(99,102,241,var(--tw-text-opacity))}',
  ])

  assert.equal(Btn({ primary: true }), {
    type: 'button',
    props: { primary: true, className: 'tw-luezaj text-purple-600' },
    children: [],
  })
  assert.equal(injector.target, [
    '.text-indigo-500{--tw-text-opacity:1;color:#6366f1;color:rgba(99,102,241,var(--tw-text-opacity))}',
    '.text-purple-600{--tw-text-opacity:1;color:#7c3aed;color:rgba(124,58,237,var(--tw-text-opacity))}',
  ])
})

test('targeting another component', ({ styled, injector }) => {
  const Child = styled('div')(() => css({ color: 'red' }))
  const Parent = styled('div')(() =>
    css({
      [`& ${Child}`]: {
        color: 'green',
      },
    }),
  )

  assert.is(Child.displayName, 'Styled(div)')
  assert.is(Child.toString(), '.tw-8kc521')

  assert.is(Parent.displayName, 'Styled(div)')
  assert.is(Parent.toString(), '.tw-1r2ndvr')

  // Nothing injected yet
  assert.equal(injector.target, [])

  assert.equal(Child({}), {
    type: 'div',
    props: { className: 'tw-8kc521 tw-18kwa36' },
    children: [],
  })
  assert.equal(injector.target, ['.tw-18kwa36{color:red}'])

  assert.equal(Parent({ children: Child({}) }), {
    type: 'div',
    props: {
      className: 'tw-1r2ndvr tw-rkkmpf',
      children: {
        type: 'div',
        props: {
          className: 'tw-8kc521 tw-18kwa36',
        },
        children: [],
      },
    },
    children: [],
  })
  assert.equal(injector.target, ['.tw-18kwa36{color:red}', '.tw-rkkmpf .tw-8kc521{color:green}'])
})

test('using "as" prop', ({ styled, injector }) => {
  const Button = styled<{ href?: string }>('button', {
    sm: 'text-sm',
    md: 'text-lg',
  })

  // Nothing injected yet
  assert.equal(injector.target, [])

  assert.equal(Button({}), {
    type: 'button',
    props: { className: 'tw-7ofjto sm:text-sm md:text-lg' },
    children: [],
  })

  assert.equal(Button({ as: 'a', href: 'https://github.com/tw-in-js/twind' }), {
    type: 'a',
    props: {
      href: 'https://github.com/tw-in-js/twind',
      className: 'tw-7ofjto sm:text-sm md:text-lg',
    },
    children: [],
  })
  assert.equal(injector.target, [
    '@media (min-width: 640px){.sm\\:text-sm{font-size:0.875rem;line-height:1.25rem}}',
    '@media (min-width: 768px){.md\\:text-lg{font-size:1.125rem;line-height:1.75rem}}',
  ])
})

test('using "as" prop on Components', ({ styled, injector }) => {
  const Span = styled.span('text-sm')

  const Button = styled<{ href?: string }>(Span, 'rounded-md')

  // Nothing injected yet
  assert.equal(injector.target, [])

  assert.equal(Span({}), {
    type: 'span',
    props: { className: 'tw-oog4p9 text-sm' },
    children: [],
  })

  // The as prop is passed through
  assert.equal(Button({ as: 'button', href: 'https://github.com/tw-in-js/twind' }), {
    type: Span,
    props: {
      as: 'button',
      href: 'https://github.com/tw-in-js/twind',
      className: 'tw-dvetc rounded-md',
    },
    children: [],
  })
  assert.equal(injector.target, [
    '.text-sm{font-size:0.875rem;line-height:1.25rem}',
    '.rounded-md{border-radius:0.375rem}',
  ])
})

test('merge "className" prop', ({ styled, injector, tw }) => {
  const Span = styled('span', 'text-sm')

  // Nothing injected yet
  assert.equal(injector.target, [])

  assert.equal(Span({ className: tw`rounded-md` }), {
    type: 'span',
    props: { className: 'rounded-md tw-oog4p9 text-sm' },
    children: [],
  })

  assert.equal(injector.target, [
    '.text-sm{font-size:0.875rem;line-height:1.25rem}',
    '.rounded-md{border-radius:0.375rem}',
  ])
})

test('merge "class" prop', ({ styled, injector }) => {
  const Span = styled('span', 'text-sm')

  // Nothing injected yet
  assert.equal(injector.target, [])

  assert.equal(Span({ class: 'hero' }), {
    type: 'span',
    props: { className: 'hero tw-oog4p9 text-sm' },
    children: [],
  })

  assert.equal(injector.target, ['.text-sm{font-size:0.875rem;line-height:1.25rem}'])
})

test.run()
