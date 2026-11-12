'use client'

import { useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'

export interface LevelSliderProps<Level extends string> {
  /** The levels, lowest first: at least one, each once. */
  levels: readonly Level[]
  /** The level chosen, when the parent holds it. */
  value?: Level
  /** The level shown first, when the slider holds it. Default: the lowest. */
  defaultValue?: Level
  /** Called with the level picked by a click, a drag or a key. */
  onValueChange?: (level: Level) => void
  /** The level in words, read by assistive technologies. Default: the level itself. */
  levelText?: (level: Level) => string
  disabled?: boolean
  id?: string
  className?: string
  style?: CSSProperties
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
}

/** One level up (1) or down (-1); left and right swap in a right-to-left page. */
const VERTICAL_KEYS: Readonly<Record<string, number>> = {
  ArrowUp: 1,
  PageUp: 1,
  ArrowDown: -1,
  PageDown: -1,
}
const HORIZONTAL_KEYS: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowLeft: -1 }

const rightToLeft = (element: Element) => getComputedStyle(element).direction === 'rtl'

/**
 * A few named levels on one small pill, a dot per level and a round handle on
 * the one chosen. The pill is the control: a click or a drag picks the level
 * nearest the pointer, and it is an ARIA slider for the keyboard (arrows,
 * Page Up/Down, Home, End) and assistive technologies.
 */
export function LevelSlider<Level extends string>({
  levels,
  value,
  defaultValue,
  onValueChange,
  levelText = String,
  disabled = false,
  className,
  style,
  ...rest
}: Readonly<LevelSliderProps<Level>>) {
  const [held, setHeld] = useState(defaultValue)
  const last = levels.length - 1
  if (last < 0) return null
  const index = Math.max(0, levels.indexOf(value ?? held ?? (levels[0] as Level)))

  const pick = (at: number) => {
    const target = Math.min(last, Math.max(0, at))
    if (disabled || target === index) return
    const level = levels[target] as Level
    if (value === undefined) setHeld(level)
    onValueChange?.(level)
  }

  const pickAtPointer = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    // The handle's centre runs from half the pill's height to the other end.
    const travel = box.width - box.height
    const offset = rightToLeft(event.currentTarget)
      ? box.right - event.clientX
      : event.clientX - box.left
    pick(travel > 0 ? Math.round(((offset - box.height / 2) / travel) * last) : 0)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const { key } = event
    let at: number | undefined
    if (key === 'Home') at = 0
    else if (key === 'End') at = last
    else if (key in VERTICAL_KEYS) at = index + (VERTICAL_KEYS[key] as number)
    else if (key in HORIZONTAL_KEYS) {
      const step = HORIZONTAL_KEYS[key] as number
      at = index + (rightToLeft(event.currentTarget) ? -step : step)
    }
    if (at === undefined) return
    event.preventDefault()
    pick(at)
  }

  return (
    <span
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-valuemin={0}
      aria-valuemax={last}
      aria-valuenow={index}
      aria-valuetext={levelText(levels[index] as Level)}
      aria-disabled={disabled || undefined}
      {...rest}
      className={className ? `level-slider ${className}` : 'level-slider'}
      style={{ ...style, '--level-slider-at': last ? index / last : 0 } as CSSProperties}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        if (disabled || event.button !== 0) return
        event.currentTarget.setPointerCapture(event.pointerId)
        pickAtPointer(event)
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) pickAtPointer(event)
      }}
    >
      <span className="level-slider-fill" />
      {levels.map((level, at) => (
        <span
          key={level}
          className="level-slider-notch"
          style={{ '--level-slider-notch-at': last ? at / last : 0 } as CSSProperties}
        />
      ))}
      <span className="level-slider-thumb" />
    </span>
  )
}
