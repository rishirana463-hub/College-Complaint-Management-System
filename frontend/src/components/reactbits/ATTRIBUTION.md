# React Bits adaptations

WarpText and BorderGlow are adapted from React Bits by David Haz:

- https://reactbits.dev/text-animations/warp-text
- https://reactbits.dev/components/border-glow
- Source registries: https://reactbits.dev/r/WarpText-JS-CSS.json and https://reactbits.dev/r/BorderGlow-JS-CSS.json (retrieved 2026-09-28).

The adjacent LICENSE.md retains the upstream license. WarpText keeps the upstream shader and text rasterization, with Campusdesk typography, visible text fallback, graphics-context loss handling, and no animation on touch/reduced-motion devices or hidden surfaces. BorderGlow keeps the edge-proximity and gradient-mask treatment, with navy/violet theme tokens, restrained fill, semantic containers, unobstructed controls, and a static focus treatment. The optional entrance sweep is omitted; the effect follows pointer movement only.
