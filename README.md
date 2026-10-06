# SPIL Label Crafter 🏷️

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Material UI v5](https://img.shields.io/badge/Material--UI-M3%20Expressive-007FFF?logo=mui&logoColor=white)](https://mui.com/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL%20Canvas-black?logo=threedotjs&logoColor=white)](https://threejs.org/)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2%20Windows-24C8DB?logo=tauri&logoColor=white)](https://tauri.app/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

**SPIL Label Crafter** is an industrial-grade, Figma-inspired desktop label designer engineered for **SPIL Opti** (cutting optimization) and **SPIL ERP** production workflows. It couples high-precision WebGL CAD-style label composition with seamless thermal printer protocol generation (ZPL, TSPL, EZPL, EPL, DPL, SBPL).

---

## 🌟 Key Highlights

- **Hardware-Accelerated WebGL Canvas**: Millimeter-accurate design viewport powered by Three.js featuring real-time grid snapping, multi-tier millimeter guidelines, element snapping, and rotation handles.
- **Material Design 3 Expressive UI**: Professional dark navy (`#0F2240`) and royal blue theme, pill navigation badges, fluid toolbars, high-contrast typography, and floating controls.
- **Bi-Directional Host Integration**:
  - **Opti Mode**: Optimized for piece labels (`orderNumber`, `Barcode`, `GlassSpec`, `RackSequence`, offcut tags).
  - **ERP Mode**: Metro/batch production tags (`OrderNo`, customer shipping, work-in-progress routing).
- **Embedded Thermal Print Compiler**: Real-time syntax-highlighted code generator and direct network dispatch to Zebra, TSC, Godex, Datamax, and Sato thermal printers on port 9100.
- **Smart Template Wizard**: Visual preset gallery (Industrial Executive, Modern Framed, Production Dense, Minimal Stack) with OIF piece specification auto-binding.
- **Enterprise Diagnostics & Standalone Shell**: Windows-native standalone execution (Rust Tauri v2) with SQL database health polling, Windows Credential Manager integration, and auto-retry backoff.

---

## 🏗️ Architecture & Core Modules

```
src/
├── canvas/             # Three.js WebGL 2D/3D Label Scene
│   ├── LabelCanvas.jsx # Main interactive canvas & pointer event handling
│   ├── SceneManager.js # Orthographic camera, pixel-to-millimeter transform
│   ├── fieldTextures.js# High-DPI canvas texture rendering for text, barcodes & QR
│   └── coords.js       # Coordinate translation (world, local, screen space)
├── theme/              # MUI theme definitions (Material Design 3 tokens)
│   └── muiTheme.js     # Light/Dark mode palette, typography, component overrides
├── store/              # Zustand + Immer reactive state management
│   └── labelStore.js   # Canvas elements, selection, history stack, connection status
├── services/           # Backend communication & printer language compilers
│   └── printService.js # ZPL/TSPL/EZPL generation, health checks, printer endpoints
├── ui/                 # Material Design 3 UI components & panels
│   ├── TopHeader.jsx   # Fixed rectangular header with tabs, mode switch & actions
│   ├── CanvasSubBar.jsx# Dimensions, DPI, brand selectors & tool actions
│   ├── ComponentsSidebar.jsx # Drag-and-drop primitives, field catalog & layer tree
│   ├── PropertiesPanel.jsx   # Fine-grained geometry, typography, barcode options
│   ├── BottomFooter.jsx# Status indicators, zoom controls, cursor readouts
│   ├── ZplPreviewPanel.jsx   # Docked printer language inspector
│   └── StartupSplashScreen.jsx # Unboxed desktop splash with animated hex field
├── views/              # View screens
│   ├── TemplateLibraryView.jsx # Template management with default toggle controls
│   ├── SettingsView.jsx        # Database, service & printer configuration
│   └── OptiLabelsSettingsView.jsx # OIF rules & import settings
└── modals/             # Wizards & Dialogs
    ├── OifTemplateWizardModal.jsx # Visual style picker with live preview cards
    ├── ExportDialog.jsx           # JSON, SVG, PNG & ZPL direct export
    └── LoadRealDataModal.jsx      # Production batch & piece data loader
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or `v22.x`
- **npm** or **pnpm**
- *(Optional for print execution)*: **SPIL Label Print Service** (`.NET 8+`) running at `http://localhost:5088`
- *(Optional for desktop app)*: **Rust** `1.80+` with Tauri CLI

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/Evil-Shown/Label-Crafter.git
cd "Label-Crafter"

# Install project dependencies
npm install

# Start Vite development server
npm run dev
```

The app will launch at `http://localhost:5175`.

### Building Production Bundles

```bash
# Verify unit tests
npm test

# Build client web bundle
npm run build

# Run desktop Tauri application (Windows native)
npm run tauri dev
```

---

## 🖨️ Thermal Printing & Language Support

Lable Crafter communicates with thermal barcode printers via raw socket transmission (JetDirect Port `9100` / USB / Windows spooler):

| Language | Printer Families Supported | Primary Capabilities |
| :--- | :--- | :--- |
| **ZPL II** | Zebra (ZT410, ZD421, GK420d, etc.) | High-speed vector rendering, native fonts, Code 128, QR Code |
| **TSPL / TSPL2** | TSC, GoDEX (EZ series), Citizen | Compressed bitmaps, reverse printing, label gap detection |
| **EZPL** | GoDEX native protocol | Industrial peel-off and cutter synchronization |
| **EPL / EPL2** | Legacy Zebra / Eltron printers | Compact legacy packing, line drawing |
| **DPL / SBPL** | Datamax-O'Neil, SATO | Industrial packaging and high-throughput dispatch |

### Direct Testing with Label Print Service

To start the accompanying `.NET` print service locally:

```powershell
cd "../Lable Print Service/src/Spil.LabelPrint.Service"
dotnet run --urls=http://localhost:5088
```

---

## ⌨️ Productivity Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| <kbd>Space</kbd> + Drag | Pan across canvas workspace |
| <kbd>Ctrl</kbd> + <kbd>0</kbd> | Fit label canvas to viewport |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo last change |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> / <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | Redo change |
| <kbd>Ctrl</kbd> + <kbd>D</kbd> | Duplicate selected elements |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | Save template to library / database |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd> | Delete selected elements |
| <kbd>Arrow keys</kbd> | Nudge elements by 1mm (<kbd>Shift</kbd> for 5mm) |
| <kbd>Ctrl</kbd> + <kbd>A</kbd> | Select all elements on canvas |

---

## 📋 Data Contract & Template Schema

Templates are stored in standardized JSON format compatible with **SPIL Opti** `sections.main.fields`:

```json
{
  "id": "LBL_001",
  "name": "Standard Production Piece",
  "client": "opti",
  "labelType": "production",
  "width": 100,
  "height": 150,
  "unit": "mm",
  "printerDpi": 300,
  "margins": { "top": 2, "left": 2, "right": 2, "bottom": 2 },
  "sections": {
    "main": {
      "enabled": true,
      "fields": [
        {
          "fieldKey": "order_header",
          "type": "text",
          "label": "Order Number",
          "value": "ORDER: {{orderNumber}}",
          "x": 4,
          "y": 6,
          "width": 92,
          "height": 12,
          "fontSize": 14,
          "bold": true
        },
        {
          "fieldKey": "piece_barcode",
          "type": "barcode",
          "barcodeType": "CODE128",
          "source": ["Barcode", "pieceNumber"],
          "x": 4,
          "y": 24,
          "width": 92,
          "height": 28
        }
      ]
    }
  }
}
```

---

## 🛡️ License & Attributions

Proprietary software developed for **SPIL LABS (Sri Lanka)**. All rights reserved.  
Icons provided by [Lucide Icons](https://lucide.dev/). UI components powered by [MUI (Material UI)](https://mui.com/).
