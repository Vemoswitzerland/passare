# passare.ch — Design System v1.0

> **"Kuratierte Schweizer Deal-Redaktion."**
> Die Plattform soll nicht wie ein Marktplatz wirken, sondern wie eine Redaktion,
> die Mandate prüft, strukturiert und erzählt.

**Live-Vorschau:** `/design` (Beta-Gate erforderlich)

---

## 🎯 Positioning-Referenz

passare.ch orientiert sich visuell an:
- **Partners Group** — institutionell-schweizerisch, dokumentarische Bildsprache
- **Runway Financial** — Typo-Präzision, Variable Fonts, moderne Mikro-Interaktionen
- **Luxury-Real-Estate-Editorials** — Listings als Magazin-Artikel, nicht als Karten
- **Julius Baer / UBS** — gedeckte Tiefe, warme Akzente, keine Commodity-Blau-Palette
- **Linear / Stripe / Vercel** — Hairlines statt Material-Shadows, dezente Motion

**Ausdrücklich nicht:** firmenzukaufen.ch, companymarket.ch, firmo.ch, dub.de — alle
wirken wie "Börse mit Filter" statt wie kuratierte Plattformen.

---

## 🎨 Farbpalette

### Brand
| Token | Hex | Verwendung |
|---|---|---|
| `ink` | `#0A0F12` | Primär-Text. Tief, aber nicht reines Schwarz. |
| `navy` | `#0B1F3A` | Institutional Deep-Navy für Headlines, Nav-Logo, Primary-Button. |
| `bronze` | `#B8935A` | Premium-Warm-Akzent. Swiss-Private-Banking-Touch, Akzent-Punkte, Hover-States. |
| `cream` | `#FAF8F3` | Warm Off-White — unsere Grundhaltung statt Stahl-Weiss. |
| `paper` | `#FFFFFF` | Surface für Cards und hervorgehobene Content-Blöcke. |

### Neutrals
| Token | Hex | Verwendung |
|---|---|---|
| `stone` | `#E8E6E0` | Hairline-Border (0.5–1px). Das Hauptmittel zur Strukturierung. |
| `fog` | `#DDD9D1` | Etwas dunklere Hairline für Hover/Active-States. |
| `quiet` | `#8A9099` | Tertiär-Text, Captions, Quellen-Angaben. |
| `muted` | `#5A6471` | Sekundär-Text, Lead-Texte, Beschreibungen. |

### Status (sparsam einsetzen)
| Token | Hex | Verwendung |
|---|---|---|
| `success` | `#1F7A4D` | Gedecktes Flaschen-Grün (nie Apple-Grün). |
| `warn` | `#9A6B1E` | Warm-Ocker (nie Gelb). |
| `danger` | `#B8322A` | Tief-Rot (nie Ferrari-Rot). |

**Regel:** Status-Farben nur für echten State (Erfolg/Fehler/Warnung), nie für
dekorative Zwecke.

---

## ✍️ Typografie

### Fonts
- **Display-Serif:** [**Fraunces**](https://fonts.google.com/specimen/Fraunces) (Variable, opsz 9–144, SOFT-Axis)
  - Grund: editorial, warm, variable — fühlt sich an wie Tiempos/GT Sectra, ist aber gratis (OFL)
  - `opsz: 144` + `SOFT: 30–50` für grosse Displays → weich, premium
- **UI / Body Sans:** [**Geist Sans**](https://vercel.com/font) (Variable, Vercel)
  - Grund: Swiss-Grotesk-Erbe, sehr neutral, exzellent für UI — Gefühl von Söhne/GT America ohne Lizenzkosten
- **Mono:** [**Geist Mono**](https://vercel.com/font) (für Deal-Zahlen, Preise, Daten)

### Fallback-Stack
```css
--font-serif: 'Fraunces', 'Tiempos', Georgia, serif;
--font-sans: 'Geist', 'Inter', system-ui, sans-serif;
--font-mono: 'Geist Mono', ui-monospace, monospace;
```

### Type-Scale (Tailwind-Tokens)

| Token | Wert | Einsatz |
|---|---|---|
| `text-display-xl` | `clamp(3.5rem, 8vw, 8rem)` | Hero-Headline (z.B. «Der vertrauensvolle Übergang.») |
| `text-display-lg` | `clamp(2.75rem, 6vw, 5.5rem)` | Section-Headlines |
| `text-display-md` | `clamp(2.25rem, 4.5vw, 4rem)` | Block-Headlines |
| `text-display-sm` | `clamp(1.75rem, 3.5vw, 2.75rem)` | Grosse KPI-Zahlen |
| `text-head-lg` | `2rem / lh 1.2` | H3 |
| `text-head-md` | `1.5rem / lh 1.3` | H4 |
| `text-head-sm` | `1.25rem / lh 1.35` | Kleine Titel |
| `text-body-lg` | `1.125rem` | Lead-Paragraphen |
| `text-body` | `1rem` | Standard-Text |
| `text-body-sm` | `0.9375rem` | Dichte UI-Texte |
| `text-caption` | `0.8125rem` | Quellen, Fussnoten |
| `overline` | `12px uppercase letter-spacing 0.14em` | Labels, Kategorie-Marker |

### Font-Weights
- **Headlines:** 300–400 (nie 700+, wirkt laut)
- **UI:** 400 body, 500 emphasis, 600 labels
- **Mono:** 400 regular (für Deal-Zahlen mit `font-tabular`)

### Regeln
- Headlines → **IMMER** in Serif, Gewicht **light (300–400)**, Letter-Spacing negativ
- Body → Sans, 16–18px, line-height 1.6
- Mono → nur für Zahlen, Codes, UIDs — mit `font-variant-numeric: tabular-nums`
- Grosse Hero-Titel nutzen `.font-serif-display` Class → aktiviert opsz 144 + SOFT 50

---

## 📐 Layout & Spacing

### Grid
- **Max-Width Content:** 1200px (`max-w-content`)
- **Max-Width Container:** 1240px (`max-w-container`) für Outer-Frames
- **Max-Width Prose:** 672px (`max-w-prose`) für Textblöcke
- **Max-Width Hero:** 960px (`max-w-hero`) für Hero-Headlines
- **Horizontale Gutter:** `px-6` mobile / `px-10` desktop

### Section-Padding
- Desktop: `py-32` (128px oben + unten)
- Mobile: `py-16` (64px)
- Tokens: `py-section-y` / `py-section-y-sm`

### Whitespace-Regel (Swiss-Style)
Whitespace ist **kein** leerer Platz, sondern **Substanz**. Lieber:
- Eine Section fast leer lassen, als zwei Sections zusammenquetschen
- Zwei Spalten statt drei
- Grosszügig Zeilenhöhe und Paragraph-Margin

---

## 🧩 Komponenten

### Button
- **Radius:** `rounded-soft` (6px) — NIE Pill-Shape
- **Sizes:** `sm` / `md` / `lg` (py-2/3/4)
- **Varianten:**
  - `primary` — Solid Navy, Hover: Ink + translateY(-1px) + Shadow-Lift
  - `secondary` — Transparent + border-navy/15, Hover: volle Border + Lift
  - `bronze` — Premium-Akzent für Upgrade-CTAs
  - `ghost` — Transparent, subtile Background bei Hover
- **Transition:** 300ms `ease-out-expo`

### Card
- **Radius:** `rounded-card` (12px)
- **Padding:** 32px (2rem) Standard, 40px für Hero-Cards
- **Background:**
  - `paper` → weiss mit `shadow-card` (dezente Depth)
  - `quiet` → cream-Variant mit 1px `stone`-Border
- **Interactive:** `hover:-translate-y-1 hover:shadow-lift` (200ms)

### Input
- **Radius:** `rounded-soft` (6px)
- **Height:** 48px
- **Border:** 1px `stone`
- **Focus:** Border wechselt auf `bronze`, `shadow-focus` (3px bronze/30 Ring)

### Badge
- **Shape:** Pill (9999px)
- **Padding:** `px-3 py-1`
- **Varianten:** neutral, navy, bronze, success, live (mit pulse-dot)

### Divider
- **Default:** 1px solid `stone`
- **Hairline:** 0.5px (via `border-hairline`)
- **Mit Label:** zentriert, Overline in der Mitte, Hairlines links/rechts

---

## 🎭 Icons

- **Set:** [Lucide React](https://lucide.dev)
- **Standard-Stroke:** **1.5px** (`strokeWidth={1.5}`)
- **Grössen:**
  - `w-4 h-4` (16px) — inline in Buttons/Links
  - `w-5 h-5` (20px) — UI-Elemente
  - `w-6 h-6` (24px) — prominente Header/Cards
- **Farbe:** `currentColor` (erbt vom Parent)
- **Regel:** NIE Filled-Icons mischen. Immer Outline. Immer gleicher Stroke.

---

## 🎬 Motion

### Philosophy
> Motion strukturiert Information, dekoriert sie nicht.

### Patterns
| Muster | Dauer | Easing | Einsatz |
|---|---|---|---|
| **Card-Hover-Lift** | 200ms | `ease-out` | translateY(-4px) + Shadow-Tausch |
| **Button-Hover** | 300ms | `ease-out-expo` | translateY(-1px) + Shadow |
| **Fade-Up** | 700ms | `ease-out-expo` | opacity 0→1, translateY 16px→0, on-scroll |
| **Fade-Up-Slow** | 1000ms | `ease-out-expo` | Hero-Elemente, einmal bei Page-Load |
| **Pulse-Dot** | 2.2s | `ease-in-out` infinite | Live-Badge |

### Verboten
- ❌ Parallax
- ❌ Auto-Scrolling Karussells
- ❌ Skeuomorphe Schatten (Material-Design-Stil)
- ❌ Hüpfende Cursor, animierte Gradients
- ❌ GIF-Backgrounds

### Tool
- **Framer Motion** für komplexere Sequenzen + Scroll-Trigger (`whileInView`)
- **CSS-Only** für simple Hover/Transitions

---

## 🇨🇭 Swiss Details

### Anführungszeichen
**Immer Guillemets** — `«so»`, **nie** `„so"` oder `'so'`.

### Währungsformat
CHF mit **Hochkomma als Tausender-Trenner** — `CHF 1'250'000`,
**nicht** `1,250,000` oder `1.250.000`.

### Kantons-Kürzel
Firmenstandorte **immer** mit Kantons-Kürzel: `Zürich ZH`, `Lausanne VD`.

### Datumsformat
Schweizer Format mit Punkten, Tag vor Monat: `24.04.2026`.

### Sprachen
**Textlisten** statt Flaggen: `DE · FR · IT · EN`. Flaggen sind politisch und mehrdeutig.

### Hairlines statt Shadows
0.5px `stone`-Trennlinien sind unser **Hauptmittel zur Strukturierung** —
nicht Shadows, nicht Boxes, nicht farbige Panels.

---

## 🛑 Design-Regeln (harte Linien)

1. **Kein Blau als Primary.** Navy ist erlaubt, Azur/Royal-Blau nicht.
2. **Kein reines Schwarz.** Immer `ink` (#0A0F12) für Text, `navy` für Headlines.
3. **Kein reines Weiss im Body-Background.** Immer `cream` (#FAF8F3).
4. **Kein Gradient in Brand-Elementen.** Ein Punkt, eine Farbe, klar.
5. **Keine Stock-Fotos.** Wenn Bilder, dann dokumentarisch (Schweizer Werkstätten,
   echte Menschen, desaturiert oder schwarzweiss).
6. **Keine Handshake-Shots, keine "diverse Business-Meetings".**
7. **Kein Corporate-Sprech.** Nicht "Innovative Lösungen" — stattdessen konkret:
   "Anonymisierte Profile. NDA vor jeder Detail-Einsicht."
8. **Kein Karussell.** Was wichtig ist, wird gezeigt, nicht rotiert.
9. **Keine Pills bei Buttons.** Radius 6–8px, nicht mehr.
10. **Keine FONT-SCHRIFTLICHE SHOUTING CAPS.** Uppercase nur als Overline (12px, letter-spacing 0.14em).

---

## 📁 Dateistruktur

```
src/
├── app/
│   ├── layout.tsx              # Fraunces + GeistSans + GeistMono Setup
│   ├── globals.css             # Swiss Base-Styles
│   ├── page.tsx                # Homepage (Editorial)
│   ├── design/page.tsx         # Living Style Guide (/design)
│   └── beta/                   # Beta-Gate
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── badge.tsx
│       ├── divider.tsx
│       └── container.tsx       # Container + Section
└── lib/
    └── utils.ts                # cn(), formatCHF, formatDate
```

---

## 🔄 Versionierung

- **v1.0** — Etappe 1.5 (Design-Sprint vor Etappe 2)
  - Fraunces + Geist Fonts
  - Navy / Bronze / Cream Palette
  - Lucide Icons 1.5px
  - Framer Motion Patterns
  - Living Style Guide unter `/design`

Jede grössere Änderung am Design-System wird hier dokumentiert mit Datum + Grund.
