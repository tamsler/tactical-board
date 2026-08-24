# ⚽ Tactical Soccer Board (West Sacramento Futbol Club)

An interactive, responsive web-based tactical soccer board built with **React**, **TypeScript**, **Tailwind CSS**, and **Vite**.

Designed for coaches and analysts to easily set up formations, design training drills, illustrate passing/movement phases, and export professional diagrams to high-res images and PDF sheets.

---

## 🌟 Features

- **⚽ Match Formats & Formations**:
  - **11v11, 9v9, and 7v7** youth formats.
  - Formations presets (4-3-3, 4-2-3-1, 4-4-2, 3-5-2, 3-4-3, 5-3-2, 3-2-3, 3-3-2, 2-3-1, etc.).
  - **7v7 Build-Out Lines** regulation overlay.

- **🏟️ Pitch Layouts & Textures**:
  - **Full Pitch**, **Half Pitch** (goal at top, halfway line at bottom), and **Just Grass** (no lines for custom drills).
  - Visual themes: Classic FIFA Stripes, Pure Grass Green, Dark Tactical Slate, Blueprint.
  - Tactical 18-zones / half-spaces and fine coordinate grids.

- **🎨 Tactical Drawing Tools**:
  - **Solid Arrow**: Player movement and runs.
  - **Dashed Arrow**: Ball passes and crosses.
  - **Sine Wave Line**: Smooth mathematical dribble paths.
  - **Bézier Curved Line**: Arched runs and switch passes with drag handles.
  - **Screen / Block Bar**: Tactical screening and blocking.
  - **Tactical Zones & Shapes**: Shaded pressing traps and overload boxes with resize handles.
  - **Move & Drag Anything**: Reposition any line, endpoint, curve, or shape after creation.
  - **Text Annotations**: Coaching tags and labels.

- **💾 Export & Save**:
  - **PNG / JPEG**: High-resolution image export.
  - **SVG**: Scalable vector graphics.
  - **PDF Sheet**: Formatted tactical coaching sheet with diagrams and coaching notes.
  - **JSON**: Save and reload board states anytime.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- `npm`

### Installation

```bash
# Clone the repository
git clone https://github.com/tamsler/tactical-board.git

# Navigate into project directory
cd tactical-board

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
npm run build
```

---

## 🛠️ Tech Stack

- **React 19** + **TypeScript**
- **Vite** + **Tailwind CSS v4**
- **Lucide Icons**
- **jsPDF** (PDF export)


See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
