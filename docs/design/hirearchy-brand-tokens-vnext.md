# Hirearchy Brand Tokens Specification (vNext)

**Status:** APPROVED ARCHITECTURAL SPECIFICATION  
**Scope:** Canonical visual design token architecture for the Hirearchy website experience.  
**Authority:** Derived from `docs/design/references/hirearchy-website-direction-v1.png` and `docs/plans/active/099-hirearchy-website-experience-rebuild.md`.

---

## 1. Token Architecture Rules

1. **Do NOT Inherit Legacy D1B Tokens:** Legacy CSS custom properties in `apps/web` belong to earlier exploratory phases and must not be used as authority.
2. **Strict CSS Custom Property Prefix:** All tokens are defined under the `--hirearchy-*` namespace.
3. **Single Swappable Accent Contract:** The accent color is provisional. Implementation agents must never hardcode raw hex values; all accent references must point to `var(--hirearchy-accent)`.

---

## 2. Core Color System

```css
:root {
  /* ==========================================================================
     CANVAS & SURFACES (Authoritative Daylight Base)
     ========================================================================== */
  --hirearchy-bg-canvas: #f7f7f4; /* Authoritative warm document canvas */
  --hirearchy-bg-canvas-cool: #f2f5f7; /* Secondary cool canvas substrate */
  --hirearchy-bg-subtle: #f2f5f7; /* Subtle tinted substrate */
  --hirearchy-bg-elevated: #ffffff; /* Highlighted card surface */
  --hirearchy-bg-glass: rgba(
    247,
    247,
    244,
    0.72
  ); /* Translucent plate backdrop */

  /* ==========================================================================
     TYPOGRAPHIC INK (Objective Drafting Inks)
     ========================================================================== */
  --hirearchy-ink-primary: #101214; /* Deep authoritative carbon ink */
  --hirearchy-ink-secondary: #555a60; /* Soft ink: high-contrast body & metadata */
  --hirearchy-ink-soft: #555a60; /* Soft ink synonym */
  --hirearchy-ink-muted: #70767d; /* Auxiliary metadata, kickers, timestamps */
  --hirearchy-ink-faint: #9fa6ad; /* Inactive tabs, disabled chrome */
  --hirearchy-ink-inverse: #f7f7f4; /* Ink over dark product workbenches */

  /* ==========================================================================
     STRUCTURAL NEUTRALS & BORDERS
     ========================================================================== */
  --hirearchy-structure: #dde2e6; /* Authoritative structure boundary */
  --hirearchy-border-subtle: #dde2e6; /* Hairline card boundary (1px) */
  --hirearchy-border-default: #dde2e6; /* Standard component divider */
  --hirearchy-border-strong: #b0b7be; /* Interactive borders, active inputs */
  --hirearchy-datum-rule: rgba(
    16,
    18,
    20,
    0.08
  ); /* Spatial alignment grid lines */

  /* ==========================================================================
     DARK PRODUCT WORKBENCH (Carbon Substrates for Code, Terminal, Telemetry)
     ========================================================================== */
  --hirearchy-product-bg: #141416; /* Core carbon console background */
  --hirearchy-product-surface: #1c1c20; /* Workbench pane surface */
  --hirearchy-product-border: #2a2a30; /* Workbench inner structural rule */
  --hirearchy-product-ink: #e8e6e1; /* Primary editor text */
  --hirearchy-product-ink-muted: #828079; /* Editor line numbers, comments */

  /* ==========================================================================
     BRAND ACCENT — AUTHORITATIVE SIGNAL VERMILION
     ==========================================================================
     Authoritative current prototype brand accent is Signal Vermilion (#F04A2F).
     The provisional Terracotta Oxide (#9E4328) has been permanently REMOVED.
     Reference ONLY var(--hirearchy-accent).
     ========================================================================== */
  --hirearchy-accent: #f04a2f; /* Signal Vermilion / Primary Brand Accent */
  --hirearchy-accent-hover: #d6381f; /* Deepened vermilion on interaction */
  --hirearchy-accent-tint: rgba(240, 74, 47, 0.08); /* Subtle highlight wash */
  --hirearchy-accent-border: rgba(
    240,
    74,
    47,
    0.28
  ); /* Focused datum indicator */

  /* ==========================================================================
     FUNCTIONAL STATUS (Factual Observable Telemetry — NOT Evaluative Scoring)
     ==========================================================================
     IMPORTANT: Verification green remains semantic only. It must NEVER be used
     as the brand accent or for candidate scoring labels.
     ========================================================================== */
  --hirearchy-status-verified: #2a694b; /* Factual test pass / command exit 0 */
  --hirearchy-status-verified-tint: rgba(42, 105, 75, 0.1);
  --hirearchy-status-failure: #f04a2f; /* Factual test fail / runtime error */
  --hirearchy-status-failure-tint: rgba(240, 74, 47, 0.1);
  --hirearchy-status-uncertainty: #b87216; /* Ambiguity, recorded pause, retry */
  --hirearchy-status-uncertainty-tint: rgba(184, 114, 22, 0.1);
}
```

---

## 3. Typographic Direction & Scale

The typography embodies **The Architecture of Evidence**: large-scale modern sans-serif authority paired with clinical technical precision. The previous editorial serif Hero headline direction is **EXPLICITLY REJECTED**.

### 3.1 Font Direction

- **Masterbrand Display & Hero Headline (`--font-display`):** Modern Sans-serif direction.
  - Scale: Large scale (approx. `88px – 104px` desktop).
  - Weight: Strong weight (`font-weight: 700` or `800`).
  - Tracking: Tight tracking (letter-spacing near `-0.05em`).
  - Line-height: `0.91 – 0.95`.
  - Direction note: Modern sans direction replaces editorial serif. Final font family remains an implementation/design-system decision.
- **Functional Sans (`--font-sans`):** Modern high-clarity neutral sans-serif stack (`system-ui`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`).
- **Technical Monospace (`--font-mono`):** Surgical monospace (`JetBrains Mono`, `SFMono-Regular`, `Consolas`, monospace).

### 3.2 Fluid Typographic Scale

```css
:root {
  --hirearchy-text-monumental: clamp(
    4.5rem,
    10.5vw,
    12.5rem
  ); /* Scene 07 Climax */
  --hirearchy-text-hero: clamp(
    5.5rem,
    7.5vw,
    6.5rem
  ); /* Scene 01 Headline (88-104px) */
  --hirearchy-text-h2: clamp(2.4rem, 4.2vw, 3.8rem); /* Scene Section Titles */
  --hirearchy-text-h3: clamp(
    1.5rem,
    2.5vw,
    2.2rem
  ); /* Workbench & Card Titles */
  --hirearchy-text-body-lg: clamp(1.1rem, 1.4vw, 1.25rem); /* Editorial Leads */
  --hirearchy-text-body: clamp(
    0.95rem,
    1.1vw,
    1.05rem
  ); /* Standard Narrative */
  --hirearchy-text-body-sm: 0.88rem; /* Specimen Descriptions */
  --hirearchy-text-caption: 0.78rem; /* Metadata & Kicker Tags */
  --hirearchy-text-mono-data: 0.82rem; /* Code, Diffs, Timestamps */
}
```

---

## 4. Spatial Spacing Rhythm

Strict 8px proportional grid:

```css
:root {
  --hirearchy-space-1: 4px;
  --hirearchy-space-2: 8px;
  --hirearchy-space-3: 12px;
  --hirearchy-space-4: 16px;
  --hirearchy-space-5: 24px;
  --hirearchy-space-6: 32px;
  --hirearchy-space-8: 48px;
  --hirearchy-space-10: 64px;
  --hirearchy-space-12: 96px;
  --hirearchy-space-16: 128px;
}
```

---

## 5. Geometry, Radius & Borders

```css
:root {
  /* Corner Radii */
  --hirearchy-radius-none: 0px;
  --hirearchy-radius-xs: 2px; /* Subtle technical chamfer */
  --hirearchy-radius-sm: 4px; /* Code blocks, metadata chips */
  --hirearchy-radius-md: 8px; /* Interactive cards */
  --hirearchy-radius-lg: 12px; /* Specimen plates, workbench windows */
  --hirearchy-radius-xl: 16px; /* Major section containers */
  --hirearchy-radius-full: 9999px; /* Pill buttons, badge tags */

  /* Border Treatments */
  --hirearchy-rule-hairline: 1px solid var(--hirearchy-border-subtle);
  --hirearchy-rule-datum: 1px solid var(--hirearchy-datum-rule);
  --hirearchy-rule-accent: 1px solid var(--hirearchy-accent);
}
```

---

## 6. Elevation & Materiality Philosophy

Hirearchy explicitly rejects floating, omnidirectional SaaS drop shadows. Elevation is governed by **physical ambient occlusion** and **natural morning daylight**:

```css
:root {
  /* Subtle plate boundary */
  --hirearchy-shadow-ambient:
    0 1px 3px rgba(22, 21, 19, 0.04), 0 1px 2px rgba(22, 21, 19, 0.06);

  /* Hovering specimen card */
  --hirearchy-shadow-card:
    0 4px 20px -2px rgba(22, 21, 19, 0.06),
    0 2px 6px -1px rgba(22, 21, 19, 0.04);

  /* Heavy physical carbon workbench */
  --hirearchy-shadow-workbench:
    0 24px 48px -12px rgba(0, 0, 0, 0.28), 0 12px 24px -8px rgba(0, 0, 0, 0.16);

  /* Glass plate backdrop blur */
  --hirearchy-glass-filter: blur(12px) saturate(140%);
}
```
