# Shop — Style Reference

**Theme:** light
**Density:** compact

Shop runs on a white-canvas discovery model where products float as large, heavily-rounded image cards. The entire interface is pillow-soft: 20–28px radii everywhere, pill-shaped controls, a compact 16px GT Standard body with tight negative tracking. A single vivid violet (#5433eb) is the system's only saturated accent. The rest of the palette is warm-neutral: white surfaces, a faint cool-gray canvas, hairline borders, and near-black text. Density stays compact with 12px gaps, but the hero and category bands breathe through generous 64–80px vertical rhythm.

## Tokens — Colors
* Canvas Mist: `#f2f4f5` (Page background)
* Pure White: `#ffffff` (Primary surface for cards, input fields, pills)
* Ink Black: `#000000` (Primary text, headings, icons)
* Faint Border: `#ebebeb` (Hairline dividers, input outlines)
* Muted Gray: `#787574` (Secondary text, inactive icons)
* Shop Violet: `#5433eb` (Search submit button, accent action)
* Violet Wash: `#c0b5f3` (Translucent halo behind the violet submit button)

## Tokens — Typography
* Primary: GT Standard (Substitute: Inter, system-ui)
* System/Messaging: Shopify Sans (Substitute: Inter)
* Hierarchy rule: The font family carries hierarchy through subtle grade shifts and tight negative tracking, not bold contrast. Do not use bold (700+) weights. 
* Scale:
  - body-lg: 16px / 1.33 line-height
  - body: 14px / 1.33 line-height
  - body-sm: 12px / 1.33 line-height
  - caption: 11px / 1.33 line-height

## Border Radius & Shadows
* Cards: 28px
* Pills / Inputs / Buttons: 9999px (fully rounded)
* Inner image radius in cards: 20px
* Shadow sm: rgba(0, 0, 0, 0.06) 0px 2px 8px 0px
* Shadow lg (Card elevation): rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px

## Do's and Don'ts
* DO: Use 28px radius for all product cards and 9999px for pills/inputs.
* DO: Pair every elevated card with the dual-layer soft shadow.
* DO: Separate layers with shadow alone on white surfaces; skip borders on cards.
* DON'T: Add a second saturated accent color (only use violet).
* DON'T: Use colored backgrounds for UI containers.
* DON'T: Use sharp corners (0px radius is reserved for image edges only).

## Tailwind v4 Variables
@theme {
  --color-canvas-mist: #f2f4f5;
  --color-pure-white: #ffffff;
  --color-ink-black: #000000;
  --color-faint-border: #ebebeb;
  --color-muted-gray: #787574;
  --color-shop-violet: #5433eb;
  --font-gt-standard: 'GT Standard', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --radius-cards: 28px;
  --radius-pills: 9999px;
  --shadow-card-elevated: rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px;
}
