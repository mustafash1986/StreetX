# 🛣️ Streetx — Street Design Studio

![Vite](https://img.shields.io/badge/Vite-61DAFB?style=for-the-badge&logo=vite&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)

**Design, remix, and share neighborhood streets — right in your browser, no account needed.**

**Streetx** is a free, open-feeling street cross-section editor that lets anyone — urban planners, advocates, students, or civil engineers — drag, drop, and resize street elements to reimagine how road space is used. Every illustration is drawn at true real-world scale, every width is validated against published design guidance (e.g., NACTO, PROWAG), and every design exports to professional formats.

---

## ✨ Key Advantages

- **📏 True-Scale Artwork, Always:** Vehicles, pedestrians, trees, and street furniture render at exact real-world dimensions. Adjusting lane width never distorts or stretches the artwork—only the pavement resizes.
- **📚 Source-Linked Design Minimums:** Every element enforces a minimum width backed by official design standards (NACTO, PROWAG) with direct source citations and reasoning.
- **⚡ Zero Friction:** No sign-up, no paywall, no account lock-in. All streets autosave locally in the browser with full import/export/link capabilities.
- **📱 Progressive Web App (PWA):** Installs directly from the browser to your desktop or mobile home screen for complete offline usability.
- **📐 Professional Engineering Exports:** Export designs instantly into production-ready CAD, vector, and image formats.

---

## 🧰 Features & Capabilities

### 🛣️ Street Editing & Interactive Canvas
- **60+ Element Types:** Across Walking, Cycling, Traffic, Transit, Planting, and Infrastructure (sidewalks, bike lanes, bus channels, light rail, trees, bollards, parklets, and more).
- **Precision Controls:** Drag to reorder or resize segment edges with $0.01\text{ m}$ precision, click to duplicate, and full keyboard shortcut support (`[` / `]` to cycle, `D` to duplicate, `Del` to delete, `/` to search).
- **Vertical Elevations & Slopes:** Per-segment edge levels, curbs, ramps, auto-calculated slopes, and one-click neighbor matching.
- **Full State Management:** Undo/redo history, local browser autosave, JSON file exports, and shareable URL links.

### 📊 Design Intelligence & Analytics
- **Live Capacity Analytics:** Real-time throughput estimation ($\text{people/hour}$) broken down by mode (pedestrian, cycling, transit, driving) alongside space-efficiency metrics and CSV data export.
- **Right-of-Way Budgeting:** Target width presets with real-time over/under indicators and instant metric $\leftrightarrow$ imperial conversion.

### 🎨 Presentation & Context
- **Environmental Themes:** 4 sky presets (*Day*, *Dusk*, *Night*, *Overcast*).
- **Urban Context:** 7 side environment backdrops (apartments, houses, green space, waterfront, boundary walls, etc.).

### 💾 Local & Professional Exports
All exports are generated locally in the browser with zero server uploads:
- **PDF:** Vector-based, A3/A4 options (Solid, Sketch, or B&W styles) with scale bars and capacity appendices.
- **PNG:** $3\times$ high-resolution rendering with transparent, sky, or solid backgrounds.
- **AI / SVG:** Layered vector file fully editable in Adobe Illustrator.
- **DWG:** Native AutoCAD 2018+ format with organized polylines and text layers in meters or millimeters.

---

## 🚀 Local Development Setup

To run Streetx locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/mustafash1986/StreetX.git](https://github.com/mustafash1986/StreetX.git)
   cd StreetX
