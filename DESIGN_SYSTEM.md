# Design System - ClioX Health Platform

## Overview

A modern, professional, and healthcare-oriented design system that emphasizes readability, trust, and user experience. The design uses a teal-emerald color palette with rounded corners, subtle shadows, and smooth animations.

## Color Palette

### Primary Colors

| Tailwind Class | Hex Value | Usage                                 |
| -------------- | --------- | ------------------------------------- |
| `teal-800`     | `#115e59` | Hero section background, primary text |
| `teal-700`     | `#0f766e` | Secondary backgrounds, borders        |
| `teal-600`     | `#0d9488` | Brand icon gradient, active states    |
| `emerald-400`  | `#34d399` | Brand icon gradient, highlights       |
| `emerald-300`  | `#6ee7b7` | Accent text, emphasis                 |
| `emerald-50`   | `#ecfdf5` | Light backgrounds, hover states       |

### Neutral Colors

| Tailwind Class | Hex Value | Usage                           |
| -------------- | --------- | ------------------------------- |
| `gray-900`     | `#111827` | Primary headings, dark text     |
| `gray-700`     | `#374151` | Secondary text, labels          |
| `gray-600`     | `#4b5563` | Body text, descriptions         |
| `gray-100`     | `#f3f4f6` | Light borders, backgrounds      |
| `gray-50`      | `#f9fafb` | Hover backgrounds, subtle fills |

### Semantic Colors

| Tailwind Class | Hex Value | Usage                             |
| -------------- | --------- | --------------------------------- |
| `white`        | `#ffffff` | Primary backgrounds, text on dark |
| `black`        | `#000000` | Text, icons                       |

## Typography

### Font Families

- **Primary**: `IBM Plex Sans` (sans-serif)
- **Secondary**: `Libre Baskerville` (serif, homepage only)

### Font Sizes

| Tailwind Class | Size (rem) | Size (px) | Usage            |
| -------------- | ---------- | --------- | ---------------- |
| `text-6xl`     | `3.75rem`  | `60px`    | Hero headings    |
| `text-5xl`     | `3rem`     | `48px`    | Section headings |
| `text-4xl`     | `2.25rem`  | `36px`    | Large headings   |
| `text-3xl`     | `1.875rem` | `30px`    | Medium headings  |
| `text-2xl`     | `1.5rem`   | `24px`    | Small headings   |
| `text-xl`      | `1.25rem`  | `20px`    | Large body text  |
| `text-lg`      | `1.125rem` | `18px`    | Body text        |
| `text-base`    | `1rem`     | `16px`    | Default text     |
| `text-sm`      | `0.875rem` | `14px`    | Small text       |
| `text-md`      | `1rem`     | `16px`    | Medium text      |

### Font Weights

| Tailwind Class  | Weight | Usage                   |
| --------------- | ------ | ----------------------- |
| `font-bold`     | `700`  | Headings, brand text    |
| `font-semibold` | `600`  | Buttons, important text |
| `font-medium`   | `500`  | Navigation, labels      |

## Border Radius

### Radius Values

| Tailwind Class | Radius (px) | Usage                                  |
| -------------- | ----------- | -------------------------------------- |
| `rounded-3xl`  | `24px`      | Header navigation, main containers     |
| `rounded-xl`   | `12px`      | Buttons, mobile menus, cards           |
| `rounded-lg`   | `8px`       | Buttons, input fields, icon containers |
| `rounded`      | `4px`       | Basic elements, subtle corners         |

## Shadows

### Shadow System

| Tailwind Class | Box Shadow                            | Usage            |
| -------------- | ------------------------------------- | ---------------- |
| `shadow-sm`    | `0 1px 2px 0 rgba(0, 0, 0, 0.05)`     | Subtle shadows   |
| `shadow-md`    | `0 4px 6px -1px rgba(0, 0, 0, 0.1)`   | Default shadows  |
| `shadow-lg`    | `0 10px 15px -3px rgba(0, 0, 0, 0.1)` | Enhanced shadows |
| `shadow-xl`    | `0 20px 25px -5px rgba(0, 0, 0, 0.1)` | Strong shadows   |

## Gradients

### Gradient Directions

| Tailwind Class      | Direction         | Usage                    |
| ------------------- | ----------------- | ------------------------ |
| `bg-gradient-to-br` | `to bottom right` | Brand icons, backgrounds |

### Gradient Colors

| Tailwind Classes                                | Colors                                                                            | Usage                 |
| ----------------------------------------------- | --------------------------------------------------------------------------------- | --------------------- |
| `from-emerald-400 to-teal-600`                  | `#34d399` → `#0d9488`                                                             | Brand icon background |
| `from-teal-800/10 via-teal-700/5 to-teal-600/5` | `rgba(17, 94, 89, 0.1)` → `rgba(15, 118, 110, 0.05)` → `rgba(13, 148, 136, 0.05)` | Hero image overlay    |

## Spacing

### Common Spacing Values

| Tailwind Class | Spacing (rem) | Spacing (px) | Usage                 |
| -------------- | ------------- | ------------ | --------------------- |
| `px-4`         | `1rem`        | `16px`       | Horizontal padding    |
| `py-2`         | `0.5rem`      | `8px`        | Vertical padding      |
| `py-3`         | `0.75rem`     | `12px`       | Button padding        |
| `py-6`         | `1.5rem`      | `24px`       | Section padding       |
| `py-8`         | `2rem`        | `32px`       | Large section padding |
| `gap-6`        | `1.5rem`      | `24px`       | Element spacing       |
| `gap-4`        | `1rem`        | `16px`       | Button spacing        |
| `ml-6`         | `1.5rem`      | `24px`       | Left margin           |

## Transitions & Animations

### Transition Durations

| Tailwind Class | Duration | Usage                |
| -------------- | -------- | -------------------- |
| `duration-200` | `200ms`  | Quick transitions    |
| `duration-300` | `300ms`  | Standard transitions |

### Transition Properties

| Tailwind Class       | Properties                              | Usage                     |
| -------------------- | --------------------------------------- | ------------------------- |
| `transition-all`     | `all`                                   | Comprehensive transitions |
| `transition-colors`  | `color, background-color, border-color` | Color changes             |
| `transition-opacity` | `opacity`                               | Opacity changes           |

### Hover Effects

| Tailwind Class         | Effect                        | Usage              |
| ---------------------- | ----------------------------- | ------------------ |
| `hover:-translate-y-1` | `transform: translateY(-4px)` | Button lift effect |
| `hover:shadow-xl`      | Enhanced shadow               | Shadow enhancement |
| `hover:bg-teal-50`     | Light teal background         | Hover backgrounds  |
| `hover:text-teal-700`  | Dark teal text                | Hover text colors  |

### Interactive Border Logic

| State                   | Default Border    | Hover Border         | Logic                                               |
| ----------------------- | ----------------- | -------------------- | --------------------------------------------------- |
| **Selected/Active**     | `border-gray-300` | `border-emerald-600` | Hover enhances the active state with deeper emerald |
| **Unselected/Inactive** | `border-gray-300` | `border-emerald-500` | Hover provides visual feedback with emerald accent  |

**Design Principle**: This creates a consistent visual hierarchy where:

- All states start with neutral gray borders (`border-gray-300`)
- Hover states use emerald tones to indicate interactivity
- Selected states get deeper emerald (`emerald-600`) to show enhanced activation
- Unselected states get lighter emerald (`emerald-500`) to show potential selection

## Interactive States

### Hover States

```css
/* Navigation links */
hover:bg-teal-50          /* background-color: #f0fdfa */
hover:text-teal-700       /* color: #0f766e */
hover:opacity-80          /* opacity: 0.8 */
hover:shadow-xl           /* Enhanced shadow */
hover:-translate-y-1      /* transform: translateY(-4px) */
```

### Active States

```css
/* Active navigation */
bg-teal-100              /* background-color: #ccfbf1 */
text-teal-700            /* color: #0f766e */
```

### Focus States

```css
/* Focus rings */
focus-visible:ring-2     /* box-shadow: 0 0 0 2px */
focus-visible:ring-teal-500  /* box-shadow: 0 0 0 2px #14b8a6 */
focus-visible:ring-offset-2  /* box-shadow: 0 0 0 2px #14b8a6, 0 0 0 4px white */
```

## Layout Patterns

### Container Layouts

```css
/* Header container */
max-w-fit mx-4           /* max-width: fit-content; margin: 0 1rem */
bg-white border          /* background: white; border: 1px solid */
rounded-3xl              /* border-radius: 24px */
shadow-lg                /* box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) */
```

### Grid Layouts

```css
/* Hero section */
grid lg:grid-cols-2      /* display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)) */
min-h-screen             /* min-height: 100vh */
```

### Responsive Design

```css
/* Breakpoint prefixes */
lg:flex                  /* display: flex (1024px+) */
xl:flex                 /* display: flex (1280px+) */
hidden lg:block         /* display: none; display: block (1024px+) */
```

## Component Examples

### Header Navigation

```tsx
<motion.div
  className="max-w-fit mx-4 bg-white border rounded-3xl shadow-lg flex items-center px-4 py-2"
  // Results in:
  // max-width: fit-content
  // margin: 0 1rem
  // background: white
  // border: 1px solid
  // border-radius: 24px
  // box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
  // display: flex
  // align-items: center
  // padding: 0.5rem 1rem
>
```

### Brand Icon

```tsx
<div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-sm">
  {/* Results in:
      width: 2rem (32px)
      height: 2rem (32px)
      border-radius: 12px
      background: linear-gradient(to bottom right, #34d399, #0d9488)
      display: flex
      align-items: center
      justify-content: center
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
  */}
</div>
```

### Button Styles

#### Primary Button (ConnectWallet)

```tsx
<motion.button
  className="px-4 rounded-lg font-medium transition-all duration-200 text-sm h-9 flex items-center cursor-pointer"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  style={{
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
  }}
>
  Connect Wallet
</motion.button>
```

#### Secondary Button (Get Started)

```tsx
<button className="bg-white text-teal-800 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
  {/* Results in:
      background: white
      color: #115e59
      padding: 1.5rem 1rem
      border-radius: 12px
      font-weight: 600
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
      hover: box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
      hover: transform: translateY(-4px)
      transition: all 200ms
  */}
  Get Started
</button>
```

#### Outline Button (Explore our solution)

```tsx
<button className="bg-transparent border border-gray-300 text-white px-6 py-3 rounded-xl font-semibold hover:border-gray-400 transition-all duration-200">
  {/* Results in:
      background: transparent
      border: 1px solid #d1d5db
      color: white
      padding: 1.5rem 1rem
      border-radius: 12px
      font-weight: 600
      hover: border-color: #9ca3af
      transition: all 200ms
  */}
  Explore our solution
</button>
```

#### Button Specifications

| Button Type     | Background                                          | Text Color | Border              | Shadow                               | Hover Effects     |
| --------------- | --------------------------------------------------- | ---------- | ------------------- | ------------------------------------ | ----------------- |
| **Primary**     | `linear-gradient(135deg, #10b981 0%, #059669 100%)` | `#ffffff`  | None                | `0 4px 12px rgba(16, 185, 129, 0.3)` | `scale: 1.05`     |
| **Secondary**   | `#ffffff`                                           | `#115e59`  | None                | `shadow-lg` → `shadow-xl`            | `-translate-y-1`  |
| **Outline**     | `transparent`                                       | `#ffffff`  | `1px solid #d1d5db` | None                                 | `border-gray-400` |
| **Acknowledge** | `#0d9488` (teal-600)                                | `#ffffff`  | `1px solid #e5e7eb` | None                                 | `bg-teal-700`     |

#### Button Size Variants

| Size        | Padding       | Font Size   | Border Radius | Height | Use Case                 |
| ----------- | ------------- | ----------- | ------------- | ------ | ------------------------ |
| **Large**   | `px-6 py-3`   | `text-base` | `rounded-xl`  | Auto   | Hero sections, main CTAs |
| **Medium**  | `px-4 py-2`   | `text-sm`   | `rounded-lg`  | `h-9`  | Standard buttons, forms  |
| **Compact** | `px-3 py-1.5` | `text-xs`   | `rounded-md`  | Auto   | Dialogs, inline actions  |
| **Small**   | `px-2 py-1`   | `text-xs`   | `rounded`     | Auto   | Tags, badges, minimal UI |

#### Button Usage Examples

```tsx
// Primary - Large (Hero CTA)
<button className="px-6 py-3 rounded-xl text-base font-semibold bg-gradient-to-r from-teal-600 to-emerald-500 text-white">
  Get Started
</button>

// Primary - Medium (Standard)
<button className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-teal-600 to-emerald-500 text-white h-9">
  Connect Wallet
</button>

// Primary - Compact (Dialog)
<button className="px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-teal-600 to-emerald-500 text-white">
  Allow
</button>

// Secondary - Medium
<button className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-teal-800 shadow-lg h-9">
  Learn More
</button>

// Outline - Medium
<button className="px-4 py-2 rounded-lg text-sm font-semibold bg-transparent border border-gray-300 text-white">
  Explore
</button>

// Acknowledge - Medium (Cookie Settings)
<button className="px-4 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white border border-gray-200 hover:bg-teal-700 transition-colors duration-200">
  Acknowledge
</button>
```

## Design Principles

1. **Modern & Clean**: Minimalist design with plenty of white space
2. **Accessible**: High contrast ratios and clear visual hierarchy
3. **Responsive**: Mobile-first approach with progressive enhancement
4. **Consistent**: Unified spacing, typography, and color system
5. **Interactive**: Subtle animations and hover effects for better UX
6. **Professional**: Healthcare-appropriate color palette and typography

## Usage Guidelines

- Use teal-800 for primary backgrounds and important text
- Apply emerald-400 for highlights and accent elements
- Maintain consistent spacing using the defined scale
- Use rounded-3xl for main containers, rounded-xl for buttons
- Apply shadow-lg as default, shadow-xl for hover states
- Keep transitions smooth with 200-300ms duration
- Ensure all interactive elements have hover and focus states
