import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { LevelSlider, type LevelSliderProps } from '../src'

const LEVELS = ['low', 'medium', 'high'] as const
type Level = (typeof LEVELS)[number]
const WORDS: Record<Level, string> = { low: 'Low', medium: 'Medium', high: 'High' }

beforeAll(() => {
  // jsdom has no pointer events nor pointer capture: the browser's, reduced to
  // what the slider reads.
  class PointerEvent extends MouseEvent {
    pointerId: number
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init)
      this.pointerId = init.pointerId ?? 1
    }
  }
  vi.stubGlobal('PointerEvent', PointerEvent)
  let captured: number | undefined
  Element.prototype.setPointerCapture = function (id: number) {
    captured = id
  }
  Element.prototype.hasPointerCapture = function (id: number) {
    return captured === id
  }
  Element.prototype.releasePointerCapture = function () {
    captured = undefined
  }
})
afterEach(cleanup)

function renderSlider(props: Partial<LevelSliderProps<Level>> = {}) {
  const onValueChange = vi.fn()
  render(
    <LevelSlider
      levels={LEVELS}
      levelText={(level) => WORDS[level]}
      aria-label="Effort"
      onValueChange={onValueChange}
      {...props}
    />,
  )
  const slider = screen.getByRole('slider', { name: 'Effort' })
  // A 76 x 18 pill at the page's left: the handle's centre stops at 9, 38 and 67.
  slider.getBoundingClientRect = () =>
    ({ left: 0, right: 76, top: 0, bottom: 18, width: 76, height: 18 }) as DOMRect
  return { slider, onValueChange }
}

const attributes = (slider: HTMLElement) => ({
  now: slider.getAttribute('aria-valuenow'),
  max: slider.getAttribute('aria-valuemax'),
  text: slider.getAttribute('aria-valuetext'),
  at: slider.style.getPropertyValue('--level-slider-at'),
})

describe('LevelSlider', () => {
  it('names the level chosen, where it sits among the others, and draws a dot per level', () => {
    const { slider } = renderSlider({ value: 'medium' })
    expect(attributes(slider)).toEqual({ now: '1', max: '2', text: 'Medium', at: '0.5' })
    expect(slider.getAttribute('aria-valuemin')).toBe('0')
    expect(slider.tabIndex).toBe(0)
    expect(slider.querySelectorAll('.level-slider-notch')).toHaveLength(3)
  })

  it('without a value: the default one, else the lowest', () => {
    expect(attributes(renderSlider({ defaultValue: 'high' }).slider).text).toBe('High')
    cleanup()
    expect(attributes(renderSlider().slider).text).toBe('Low')
  })

  it.each([
    ['ArrowRight', 'medium', 'high'],
    ['ArrowUp', 'medium', 'high'],
    ['PageUp', 'medium', 'high'],
    ['ArrowLeft', 'medium', 'low'],
    ['ArrowDown', 'medium', 'low'],
    ['PageDown', 'medium', 'low'],
    ['Home', 'high', 'low'],
    ['End', 'low', 'high'],
  ] as const)('%s from « %s »: « %s »', (key, from, to) => {
    const { slider, onValueChange } = renderSlider({ value: from })
    fireEvent.keyDown(slider, { key })
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(to)
  })

  it('past either end, or another key: nothing', () => {
    const { slider, onValueChange } = renderSlider({ value: 'high' })
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    fireEvent.keyDown(slider, { key: 'End' })
    fireEvent.keyDown(slider, { key: 'Enter' })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('in a right-to-left page, the left arrow goes up', () => {
    const { slider, onValueChange } = renderSlider({ value: 'low', style: { direction: 'rtl' } })
    fireEvent.keyDown(slider, { key: 'ArrowLeft' })
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('medium')
  })

  it('a click picks the level nearest the pointer, a drag each level it crosses', () => {
    const { slider, onValueChange } = renderSlider({ value: 'low' })
    // The press keeps the browser's default: it focuses the pill as a click
    // does, so the page's keyboard focus ring stays for the keyboard.
    expect(fireEvent.pointerDown(slider, { button: 0, pointerId: 1, clientX: 60 })).toBe(true)
    expect(onValueChange).toHaveBeenLastCalledWith('high')
    fireEvent.pointerMove(slider, { pointerId: 1, clientX: 40 })
    expect(onValueChange).toHaveBeenLastCalledWith('medium')
  })

  it('a click on the level already chosen, a pointer not captured, another button: nothing', () => {
    const { slider, onValueChange } = renderSlider({ value: 'low' })
    fireEvent.pointerDown(slider, { button: 0, pointerId: 1, clientX: 5 })
    fireEvent.pointerMove(slider, { pointerId: 2, clientX: 70 })
    fireEvent.pointerDown(slider, { button: 2, pointerId: 3, clientX: 70 })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('in a right-to-left page, a click near the left end picks the highest level', () => {
    const { slider, onValueChange } = renderSlider({ value: 'low', style: { direction: 'rtl' } })
    fireEvent.pointerDown(slider, { button: 0, pointerId: 1, clientX: 8 })
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('high')
  })

  it('held by the parent: it shows the parent’s level until the parent changes it', () => {
    const { slider, onValueChange } = renderSlider({ value: 'low' })
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(onValueChange).toHaveBeenCalledWith('medium')
    expect(attributes(slider).text).toBe('Low')
  })

  it('held by itself: it moves to the level picked', () => {
    const { slider } = renderSlider({ defaultValue: 'low' })
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(attributes(slider)).toEqual({ now: '1', max: '2', text: 'Medium', at: '0.5' })
  })

  it('disabled: out of the tab order, said so, and deaf to keys and pointer', () => {
    const { slider, onValueChange } = renderSlider({ value: 'low', disabled: true })
    expect(slider.tabIndex).toBe(-1)
    expect(slider.getAttribute('aria-disabled')).toBe('true')
    fireEvent.keyDown(slider, { key: 'End' })
    fireEvent.pointerDown(slider, { button: 0, pointerId: 1, clientX: 70 })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('no level: nothing drawn', () => {
    const { container } = render(<LevelSlider levels={[]} aria-label="Effort" />)
    expect(container.innerHTML).toBe('')
  })
})
