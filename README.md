# @uppli-io/level-slider

A few named levels on one small pill: a dot per level, a round handle on the level chosen. A click or a drag on the pill picks the level nearest the pointer. For the keyboard and assistive technologies, it is an ARIA slider. It needs nothing but React.

## Install

```sh
npm install https://github.com/uppli-io/level-slider/releases/download/v0.1.1/uppli-io-level-slider-0.1.1.tgz
```

## Use

```tsx
import { useId, useState } from 'react'
import { LevelSlider } from '@uppli-io/level-slider'
import '@uppli-io/level-slider/style.css'

const LEVELS = ['fast', 'precise'] as const
const WORDS = { fast: 'Fast', precise: 'Precise' }

export function Precision() {
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('fast')
  const titleId = useId()
  return (
    <p>
      <span id={titleId}>Precision</span> ({WORDS[level]})
      <LevelSlider
        levels={LEVELS}
        value={level}
        onValueChange={setLevel}
        levelText={(l) => WORDS[l]}
        aria-labelledby={titleId}
      />
    </p>
  )
}
```

| Prop                                                | Type                       | Default                                 |
| --------------------------------------------------- | -------------------------- | --------------------------------------- |
| `levels`                                            | `readonly Level[]`         | required: the levels, lowest first      |
| `value`                                             | `Level`                    | the level, when the parent holds it     |
| `defaultValue`                                      | `Level`                    | the first level shown, when it holds it |
| `onValueChange`                                     | `(level: Level) => void`   | called on a click, a drag or a key      |
| `levelText`                                         | `(level: Level) => string` | the level itself                        |
| `disabled`                                          | `boolean`                  | `false`                                 |
| `id`, `className`, `style`                          |                            | on the pill                             |
| `aria-label`, `aria-labelledby`, `aria-describedby` |                            | on the pill                             |

## Keyboard

| Key                               | Level        |
| --------------------------------- | ------------ |
| Arrow Right, Arrow Up, Page Up    | next one     |
| Arrow Left, Arrow Down, Page Down | previous one |
| Home                              | lowest       |
| End                               | highest      |

In a right-to-left page, Arrow Left and Arrow Right swap, and the lowest level sits at the right.

## Styling

Each size and colour is a custom property. Set it on `.level-slider`, after the import of `style.css`:

| Property                      | Default                                             |
| ----------------------------- | --------------------------------------------------- |
| `--level-slider-width`        | `76px`                                              |
| `--level-slider-height`       | `18px`                                              |
| `--level-slider-thumb-size`   | `14px`                                              |
| `--level-slider-notch-size`   | `4px`                                               |
| `--level-slider-touch-height` | `44px`: the pointer target, the pill unchanged      |
| `--level-slider-track`        | `color-mix(in srgb, currentColor 14%, transparent)` |
| `--level-slider-fill`         | `color-mix(in srgb, currentColor 12%, transparent)` |
| `--level-slider-notch`        | `color-mix(in srgb, currentColor 40%, transparent)` |
| `--level-slider-thumb`        | `currentColor`                                      |

The colours are shades of the text colour, so the pill reads on a light page and on a dark one.

## Accessibility

- `role="slider"`. `aria-valuenow` is the index of the level, and `aria-valuetext` is its `levelText`. Name it with `aria-label` or `aria-labelledby`.
- The keyboard focus ring is the page's own `:focus-visible` style: give your page one that shows.
- The pointer target is 44px high, whatever the pill's height.
- The handle moves without animation when `prefers-reduced-motion` asks for it.

## License

[MIT](LICENSE)
