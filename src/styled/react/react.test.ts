import { suite } from 'uvu'
import * as assert from 'uvu/assert'

import { renderToStaticMarkup } from 'react-dom/server'
import { html } from 'htm/react'

import type { Instance, VirtualInjector } from '../../types'
import type { Styled } from './index'

import * as DOM from '../../__fixtures__/dom-env'
import { create, virtualInjector, strict } from '../../index'
import { styled } from './index'

const test = DOM.configure(
  suite<{
    injector: VirtualInjector
    tw: Instance['tw']
    styled: Styled
  }>('styled/react'),
)

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
  context.styled = styled.bind(instance.tw)
})

test('tag with template literal', ({ styled, injector }) => {
  const H1 = styled.h1`text-5xl font-bold`

  // Nothing injected yet
  assert.equal(injector.target, [])

  const markup = renderToStaticMarkup(html`<${H1} class="hero" id="hello">Hello!<//>`)

  assert.is(markup, '<h1 id="hello" class="hero tw-1ywwrkz text-5xl font-bold">Hello!</h1>')
  assert.equal(injector.target, [
    '.text-5xl{font-size:3rem;line-height:1}',
    '.font-bold{font-weight:700}',
  ])
})

test.run()
