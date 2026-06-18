# Design System: Perplexity

---
version: alpha
name: Perplexity
description: "A search-native AI canvas built around a near-black surface (#1C1C1C in dark, white in light) with a distinctive teal-cyan accent (#20B2AA / #00B4D8) that appears on the logo, source citations, and interactive elements. The interface reads as serious and trustworthy — closer to Google Scholar than ChatGPT — with inline citations, source cards, and a focus on verifiability. Typography is set in a clean, unobtrusive system stack with clear hierarchy between query, answer, and sources. The product aesthetic communicates: this is research, not chat."

colors:
  primary: "#20B2AA"
  on-primary: "#ffffff"
  primary-hover: "#1A9B93"
  ink: "#1A1A1A"
  ink-muted: "#6B7280"
  canvas: "#ffffff"
  surface-1: "#F9FAFB"
  surface-2: "#F3F4F6"
  border: "#E5E7EB"
  canvas-dark: "#1C1C1C"
  surface-dark-1: "#252525"
  surface-dark-2: "#2F2F2F"
  border-dark: "#3A3A3A"
  ink-dark: "#F9FAFB"
  ink-muted-dark: "#9CA3AF"
  citation: "#20B2AA"
  source-card: "#F0FDFC"

typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.02em
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0

spacing:
  base: 8px
  scale: [4, 8, 12, 16, 24, 32, 48, 64]

radius:
  sm: 6px
  md: 12px
  lg: 16px
  pill: 9999px

shadows:
  card: "0 1px 3px rgba(0,0,0,0.08)"
  elevated: "0 4px 16px rgba(0,0,0,0.1)"

motion:
  duration-fast: 100ms
  duration-base: 200ms
  easing: cubic-bezier(0.4, 0, 0.2, 1)
---

## Rationale

*   **Teal as trustworthy-but-differentiated:** `#20B2AA` sits between the green of financial platforms (which signals reliability) and the blue of search engines (which signals information). For a product positioning itself as a more trustworthy AI search alternative, this color choice communicates "information authority" without the corporate coldness of pure blue or the financial associations of navy.
*   **System font stack for content primacy:** Using `-apple-system` instead of a custom typeface is a deliberate neutrality choice: Perplexity's interface shouldn't have more visual personality than the answer content it surfaces. The system font disappears, leaving only the answer and its citations — which is exactly the right hierarchy for an answer engine.
*   **16px body at 1.7 line-height as reading-first configuration:** The generous body size and line-height reflect Perplexity's self-conception as a reading experience, not a search experience. Users spend significantly more time reading Perplexity answers than traditional search result summaries — the typography is calibrated for comprehension, not skimming.
*   **Citation color = brand color:** Making citations the same teal as the primary brand accent (`#20B2AA`) elevates citations from footnotes to first-class product elements. Every time a user clicks a citation, they're reinforcing the brand association between teal and "verified source" — training users to trust the product's epistemic transparency.
*   **Source cards above the answer:** Surfacing sources before the answer text is a trust-first interface decision that differs from most AI products. It signals "we'll show you where this came from before you read it," which positions Perplexity as the antithesis of opaque AI generation and directly addresses the hallucination concerns that plague the category.

***

## 1. Visual Theme & Atmosphere

Perplexity reimagines search as a reading experience. The answer surface prioritizes legibility and trust: clean white (or dark) backgrounds, numbered inline citations that link to real sources, and a sidebar of source cards that shows the provenance of every claim. The teal accent is used sparingly — citations, the logo, focus rings — keeping the answer text the dominant visual element. The product feels like an answer engine built by people who actually care about accuracy.

## 2. Color System

*   **Canvas:** `#ffffff` (light) / `#1C1C1C` (dark) — maximum contrast for reading
*   **Teal primary:** `#20B2AA` — logo, citations, interactive states; cool and trustworthy
*   **Source cards:** Tinted `#F0FDFC` backgrounds in light mode — distinct from answer text
*   **Ink:** `#1A1A1A` / `#F9FAFB` — high contrast text
*   **Muted:** `#6B7280` / `#9CA3AF` — question labels, timestamps, secondary UI
*   **Border:** Hairline `#E5E7EB` (light) / `#3A3A3A` (dark) — separates content zones subtly

## 3. Typography

System font stack — no custom typeface, keeping the experience focused on content rather than brand expression. Query text runs larger (18–20px) and bolder. Answer body is comfortable reading size (16px) with generous line-height (1.7). Citation superscripts are teal-colored and interactive. Source titles in cards use semi-bold weight.

## 4. Components & Patterns

*   **Search bar:** Centered, large, minimal border — the entire page organizes around it
*   **Answer block:** Full-width reading column, 720px max, inline citations as superscript `[1]`
*   **Source cards:** Horizontal scrollable strip above answer; favicon, domain, excerpt
*   **Follow-up questions:** Auto-suggested pill chips below the answer
*   **Pro search toggle:** Subtle toggle for deeper, multi-step searches
*   **Copilot sidebar:** Related questions tree on the right

## 5. Spacing & Layout

Single-column answer focus. Max content width ~720px centered in viewport. Source strip runs full width above. Sidebar appears at wider viewports. Comfortable padding (24–32px) around the answer block.

## 6. Motion & Interaction

Streaming answer text renders progressively. Source cards slide in as citations are generated. Follow-up suggestions appear after answer completes. Hover on citations highlights the corresponding source card. All transitions are 200ms or less — fast enough to feel real-time.

***

## 7. Accessibility

### Contrast Ratios
*   **Primary on background** (`#20B2AA` on `#ffffff`): 2.6:1 — fails AA (decorative only; not for text use)
*   **Text on background** (`#1A1A1A` on `#ffffff`): 17.4:1 — passes AA, passes AAA
*   **Muted on background** (`#6B7280` on `#ffffff`): 4.8:1 — passes AA, fails AAA

### Minimum Requirements
*   **Touch target:** 44×44px minimum for all interactive elements
*   **Focus indicator:** `#20B2AA` outline, 2px, 2px offset
*   **Focus contrast:** 2.6:1 against `#ffffff` background — supplement with a secondary dark (`#1A1A1A`) inner outline to meet the 3:1 non-text contrast requirement

### Motion
*   **Respects `prefers-reduced-motion`:** yes — all transitions and animations should be suppressed
*   All transitions use `@media (prefers-reduced-motion: reduce)` guard

### Notes
*   The teal primary (`#20B2AA`) is 2.6:1 on white — it fails AA for text at any size; never use it as standalone text on white; pair with an underline or other non-color affordance for citation links
*   A single-color `#20B2AA` focus ring on white fails the 3:1 non-text contrast minimum (WCAG 1.4.11); implement a fallback double-ring (white inner, dark outer) or use a dark outline
*   `#6B7280` muted text at 4.8:1 just clears AA normal text but fails AAA; avoid using it for informational text that users must read to complete tasks
*   In dark mode the ink-muted value (`#9CA3AF` on `#1C1C1C`) should be verified separately; the light-mode muted value is AA-borderline and dark-mode equivalents may not match
