

# Handpan Composer: Virtual Keyboard, Settings & Icon Support

## Overview

This plan adds three major features: a virtual keyboard for note entry, a settings panel for customizing colors and keyboard options, and support for Lucide icons as note values alongside numbers.

## Architecture Decisions

- **Note values** change from `number | null` to `string | null`. A number note is stored as `"3"`, an icon note as `"icon:heart"`. This keeps URL encoding simple.
- **Settings** (hand colors, keyboard keys) are stored in **localStorage** rather than the URL, since they are user preferences, not composition data. The composition itself remains URL-encoded for sharing.
- **Virtual keyboard** appears as a fixed bar at the bottom of the screen. The user first taps a beat cell to select it, then taps a keyboard key to fill it. A "clear" key removes a note.
- **Settings panel** uses a sheet/drawer that slides in, containing color pickers and keyboard key configuration with a Lucide icon search.

## Interaction Flow

1. User taps a beat cell -- it highlights as "selected" (showing which hand + which beat position)
2. The virtual keyboard at the bottom shows the configured keys (numbers and/or icons)
3. User taps a key -- the selected cell gets that value
4. User can tap another cell to continue, or tap the same cell to deselect

## Technical Plan

### 1. Update State Model (`src/lib/composer-state.ts`)

- Change `Beat` type from `[number | null, number | null]` to `[string | null, string | null]`
- Update `encodeState`/`decodeState` to handle string values (same dot-separated format, just strings instead of numbers)
- Remove `parseInt` calls, treat values as raw strings

### 2. Create Settings Store (`src/lib/settings.ts`)

- Define a `Settings` interface:
  - `rightHandColor`: HSL string (default: `"210 80% 60%"` -- blue)
  - `leftHandColor`: HSL string (default: `"0 70% 58%"` -- red)
  - `keyboardKeys`: array of `{ type: "number", value: string } | { type: "icon", value: string }` (default: numbers 1-9)
- Read/write from `localStorage` with a `"handpan-settings"` key
- Provide a React context (`SettingsProvider`) so all components can access settings
- Apply colors as CSS custom properties on the root element when settings change

### 3. Create Virtual Keyboard Component (`src/components/VirtualKeyboard.tsx`)

- Fixed to bottom of screen, full width, with a subtle background
- Renders a scrollable row of key buttons based on `settings.keyboardKeys`
- Each key shows its number or renders the corresponding Lucide icon
- Includes a "clear" (eraser) button to remove a note
- Receives `onKeyPress(value: string | null)` callback
- Shows which hand is being edited (R/L indicator) with appropriate color
- Compact design that works well on mobile

### 4. Create Settings Panel (`src/components/SettingsPanel.tsx`)

- Uses the existing `Sheet` component, triggered by a gear icon in the header
- Two sections:
  - **Colors**: Two color inputs for right-hand and left-hand colors, with live preview swatches
  - **Keyboard Keys**: A list of currently configured keys with delete buttons, plus an "Add Key" section with:
    - Toggle between "Number" and "Icon" mode
    - For numbers: a simple number input
    - For icons: a searchable list using `cmdk` (Command component already installed) that searches through Lucide icon names
- Uses `dynamicIconImports` from `lucide-react` for the icon name list (keys of that object give all available icon names)
- Renders icon previews using lazy-loaded dynamic imports

### 5. Create Icon Renderer (`src/components/IconNote.tsx`)

- A small component that takes an icon name string and renders the corresponding Lucide icon
- Uses `React.lazy` with `dynamicIconImports` for tree-shaking
- Falls back to showing the name text if icon fails to load
- Used both in the grid cells and keyboard keys

### 6. Update BeatCell (`src/components/BeatCell.tsx`)

- Change from inline text editing to a "tap to select" model
- When tapped, it becomes "selected" (highlighted border) and notifies the parent
- Display: if value starts with `"icon:"`, render `IconNote`; otherwise show the string value
- Remove the inline input editing -- entry now happens via the virtual keyboard
- Accept colors from settings context

### 7. Update ComposerGrid (`src/components/ComposerGrid.tsx`)

- Pass through selected cell state (rowIdx, beatIdx, hand)
- Highlight the selected cell
- No major structural changes

### 8. Update Index Page (`src/pages/Index.tsx`)

- Add `SettingsProvider` wrapper
- Track selected cell state: `{ rowIdx, beatIdx, hand } | null`
- Wire virtual keyboard's `onKeyPress` to update the selected cell
- Add settings gear button in header
- Add bottom padding to account for the fixed keyboard
- Move beats/bar and bars/row config into the settings panel to clean up the main UI

### 9. Update Styles (`src/index.css`)

- Make `--hand-right` and `--hand-left` dynamically updatable via the settings context (set as inline styles on root)
- Add styles for the selected cell highlight animation

## File Summary

| File | Action |
|------|--------|
| `src/lib/composer-state.ts` | Modify -- string-based beats |
| `src/lib/settings.ts` | Create -- settings store + context |
| `src/components/IconNote.tsx` | Create -- dynamic Lucide icon renderer |
| `src/components/VirtualKeyboard.tsx` | Create -- bottom keyboard bar |
| `src/components/SettingsPanel.tsx` | Create -- settings sheet with icon search |
| `src/components/BeatCell.tsx` | Modify -- tap-to-select, icon support |
| `src/components/ComposerGrid.tsx` | Modify -- selected cell tracking |
| `src/pages/Index.tsx` | Modify -- integrate keyboard, settings, selection state |
| `src/index.css` | Modify -- dynamic color vars, selection styles |

