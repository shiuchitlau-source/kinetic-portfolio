# Design QA

- Source visual truth: `/Users/benjamin.lau/.codex/visualizations/2026/08/04/019fcbfe-a025-7e63-a29e-ce8ecfc15891/title-letter-spacing-before.png`
- PIXEL-bold desktop implementation: `/Users/benjamin.lau/.codex/visualizations/2026/08/04/019fcbfe-a025-7e63-a29e-ce8ecfc15891/title-tracking-pixel-bold.png`
- MOVING-bold desktop implementation: `/Users/benjamin.lau/.codex/visualizations/2026/08/04/019fcbfe-a025-7e63-a29e-ce8ecfc15891/title-tracking-moving-bold.png`
- Mobile implementation: `/Users/benjamin.lau/.codex/visualizations/2026/08/04/019fcbfe-a025-7e63-a29e-ce8ecfc15891/title-tracking-mobile-bold.png`
- Combined comparison: `/Users/benjamin.lau/.codex/visualizations/2026/08/04/019fcbfe-a025-7e63-a29e-ce8ecfc15891/title-tracking-comparison.png`
- Source and desktop implementation pixels/CSS viewport: 1600 × 900 at device scale 1.
- Mobile implementation pixels/CSS viewport: 390 × 844 at device scale 1.
- Normalization: source and implementation are matched at the same desktop viewport and pixel density. The combined comparison places the pre-fix and post-fix PIXEL-bold states together without resizing.
- State: settled initial hero after the pixel transition, with one horse running and the Inter title animation sampled near weight 900 for each word.

## Full-view comparison evidence

The combined comparison shows that the revised tracking keeps the same two-line centered composition, type scale, weight animation, row gap, horse overlap, and visual hierarchy. At the bold endpoint, PIXEL now has clear letter boundaries instead of compressed joins. The separate MOVING-bold capture confirms the longer word also stays distinct and within the frame.

## Focused-region comparison evidence

The title fills the hero, so the individual letter joins are directly legible in the full-view comparison and no separate crop is needed. Browser geometry measured the pre-fix tracking at `-18.216px` (`-.055em`) near weight 896. Post-fix tracking reaches approximately `-3.316px` (`-.01em`) at weight 899.75 for both words.

## Required fidelity surfaces

- Fonts and typography: the local Inter variable font, font size, line height, 8–14px row gap, weight range, and alternating timing are unchanged. Letter spacing now interpolates from `-.055em` at weight 300 to `-.01em` at weight 900, preventing bold glyph collisions while retaining the tight light-weight look.
- Spacing and layout rhythm: both title lines remain centered. MOVING measures 1346.9px wide and PIXEL 936.4px wide at the desktop bold endpoint, with no horizontal overflow. On mobile, MOVING measures 328.3px inside the 390px viewport.
- Colors and visual tokens: black title, ivory background, orange horse palette, borders, and navigation tokens are unchanged.
- Image quality and asset fidelity: the original horse canvas frames and pixel treatment are unchanged; no assets were replaced or redrawn.
- Copy and content: MOVING, PIXEL, navigation, kicker, and accessible text are unchanged.

## Findings

No actionable P0, P1, or P2 issue remains.

## Comparison history

- Earlier P2: individual letters used fixed `-.055em` tracking at every weight. At 331.2px type size this became approximately -18.2px at the bold endpoint, causing visible glyph contact.
- Fix: animated tracking alongside font weight, easing from `-.055em` at weight 300 to `-.01em` at weight 900. The reduced-motion weight-900 state also uses `-.01em`.
- Post-fix evidence: both MOVING and PIXEL reach approximately weight 899.75 with about -3.3px tracking on desktop, remain visibly separated, centered, and overflow-free. Mobile reaches the same endpoint with about -0.81px tracking and no overflow.

## Browser and interaction checks

- Desktop PIXEL-bold and MOVING-bold states were separately browser-rendered and captured at 1600 × 900.
- Mobile bold state was browser-rendered and captured at 390 × 844.
- Both words reached approximately weight 900 during sampling.
- Exactly one animated horse remains present.
- No horizontal overflow was observed at desktop or mobile.
- Production build and all four Sites worker tests pass.

## Follow-up polish

No additional polish is required for this scoped tracking adjustment.

final result: passed
