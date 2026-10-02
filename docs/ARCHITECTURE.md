# SPIL Label Platform — Design Plan, Current-System Audit & Target Architecture

**Status:** Draft for review · **Date:** 2026-10-02
**Scope:** Label Designer (Label Crafter), Label Print Service, spil-opti, ERP integration

---

## 1. Executive Summary

The label platform is three cooperating systems plus one external consumer:

| System | Today | Target |
|---|---|---|
| **Label Designer** (Label Crafter) | Browser app at `:5175`, embedded as an iframe inside Opti; templates in browser localStorage or Print Service JSON files | **Standalone Tauri v2 executable**, owns the database directly |
| **Label Print Service** | ASP.NET Core on `:5088`; template library = JSON files on disk; compiles ZPL/TSPL/EZPL/SBPL/DPL/EPL; TCP 9100 sender | Unchanged role: **always-on compile + send service** |
| **Opti** (spil-opti) | React + Tauri v2 (Rust + sqlx/MSSQL). Hosts the Designer iframe, owns a second label compiler, already has a `SpilOptiLabelTemplates` table with full CRUD | Reduced to **GET templates / POST set-default** against the shared DB |
| **ERP** | External. Posts `layout:"metro"` fields or its own template JSON | Same DB, same Designer, `client:"erp"` |

The central architectural change is **moving the template library from Print Service files into the shared MSSQL database that Opti and ERP already use**, and **making the Designer a standalone exe instead of an iframe**. Most of the data-mapping correctness work is already done and is documented in §3.5.

---

## 2. Source Requirements (translated from the design note)

> **Standalone Label Designer**
> - This is exe type build
> - ERP and Opti use the same DB
> - When exe first opens, a popup appears and the user configures the Opti setting (DB server name, DB name, password, etc.). This sets up / maps the exe.
> - Use **Rust Tauri** to build the exe
> - Keep the current design UI, but add a **configure tab** and polish the UI
> - We write Opti to have only **GET and POST** — only to get available templates from the DB and set only one as default
> - Keep the current toggle, which redirects/maps — the JSON saves to either Opti or ERP
> - When the user toggles, it maps the components to that ERP DB configured earlier

### 2.1 Derived requirements

| # | Requirement | Verification |
|---|---|---|
| R1 | Designer ships as a standalone executable | Tauri bundle target `msi` + `nsis` |
| R2 | Opti and ERP share one database | Single schema, `Client` discriminator column |
| R3 | First-run configuration popup | Shown when no valid connection config exists |
| R4 | Designer UI preserved | Existing React components reused unchanged |
| R5 | Configure tab added | New tab; holds connection + printer settings |
| R6 | Opti DB layer = GET list + POST set-default | Existing Rust commands already satisfy this |
| R7 | Client toggle retained | Toggles binding target; persists per client |
| R8 | Designer owns create / edit / delete | Full CRUD against the shared DB |
| R9 | Print Service stays a separate always-on service | Not embedded in the exe |

---

## 3. Current System Audit

### 3.1 Component inventory

#### 3.1.1 Label Designer (`Lable Crafter`)

| Layer | Path | Notes |
|---|---|---|
| Shell | `src/App.jsx` | Reads `?session=` / `?service=` query params; listens for `spil-label-open-template` postMessage |
| State | `src/store/labelStore.js` | Zustand + Immer. Holds `client`, `labelData`, `hasHostPreviewData`, `fieldCatalog`, `designSession` |
| Canvas | `src/canvas/LabelCanvas.jsx`, `SceneManager.js`, `fieldTextures.js` | Three.js WebGL surface; per-field canvas textures |
| Factories | `src/elements/factories.js` | text, header, checkbox, blackbox, barcode, qrcode, shape (rect/roundRect/ellipse/dxf), line, image, table |
| Template I/O | `src/utils/template.js`, `templateStorage.js`, `export.js` | Export/import, token resolution, localStorage library |
| Catalogs | `src/data/fieldCatalog.js` | Offline per-client field catalog + live-value probe |
| Services | `src/services/printService.js`, `designApi.js` | Compile calls, design sessions, server template library |
| UI | `src/ui/*` | `DataFieldsPanel`, `PropertiesPanel`, `MappingDialog`, `ServerLibraryModal`, `TemplateGallery`, `ZplPreviewPanel`, `BatchPreview` |

**Tech:** Vite 8, React 19, Zustand 5, Immer 11, Three.js, Tailwind 4, oxlint.

#### 3.1.2 Label Print Service (`Lable Print Service`)

| Concern | Path |
|---|---|
| Compile orchestration | `Compilation/LabelCompileService.cs` |
| Field resolution | `Compilation/LabelFieldResolver.cs` |
| ZPL emit | `Compilation/TemplateZplCompiler.cs` |
| Metro layout | `Compilation/MetroZplBuilder.cs` |
| Raster encode | `Compilation/GfaEncoder.cs` |
| Transport | `Compilation/PrinterTcpSender.cs`, `LabelJobEncoder.cs` |
| Template library | `Design/DesignStore.cs` — **JSON files** under `designer-templates/{opti,erp}` |
| Catalogs | `Design/FieldCatalogs.cs` |
| HTTP | `Controllers/LabelsController.cs`, `Controllers/DesignController.cs`, `Controllers/InfoController.cs` |

**Endpoints:** `GET /api/health` · `GET /api/brands` · `GET /api/field-catalog?client=` · `GET|POST /api/templates[/{client}/{id}]` · `GET|POST /api/design-sessions` · `POST /api/labels/compile` · `POST /api/labels/compile-batch` · `POST /api/labels/send`

**Tech:** ASP.NET Core, `System.Text.Json`, TCP 9100.

#### 3.1.3 Opti (`spil-opti`)

| Concern | Path |
|---|---|
| Label bag builders | `src/components/PrintLabel/print.jsx`, `src/components/PrintLabel2/print.jsx` (**duplicated**) |
| Shared bag builder (new) | `src/utils/labelPieceData.js` |
| Print-time resolver | `src/utils/labelFieldResolver.js` |
| Local ZPL compiler | `src/utils/labelTemplateToZpl.js` |
| Checkbox semantics | `src/utils/labelCheckbox.js` |
| Designer host | `src/utils/labelDesigner.js`, `src/components/LabelDesigner/LabelDesignerActions.jsx` |
| Labels config page | `src/pages/.../ConfigurationPopup/SubPages/Labels/index.jsx` |
| **Database layer** | `src-tauri/src/database.rs` — sqlx/MSSQL |
| Tauri commands | `src-tauri/src/lib.rs` |

**Already implemented in Rust (`database.rs`):** `test_connection`, `get_all_label_templates`, `upsert_label_template`, `delete_label_template`, `set_default_label_template`, `get_opti_colour_settings`, `get_offcut_threshold_by_glass_family`, plus `ensure_label_templates_table` (self-migrating DDL).

**Connection string:** `src-tauri/Connection.txt` → `mssql://user:pass@host:1433?TrustServerCertificate=true&database=DBNAME`

**Existing schema:**

```sql
CREATE TABLE [dbo].[SpilOptiLabelTemplates] (
    [Id]              NVARCHAR(50)  NOT NULL PRIMARY KEY,
    [Name]            NVARCHAR(255) NOT NULL,
    [TemplateJson]    NVARCHAR(MAX) NOT NULL,
    [IsDefault]       BIT           NOT NULL DEFAULT (0),
    [IsDefaultOffcut] BIT           NOT NULL DEFAULT (0),
    [LabelType]       NVARCHAR(20)  NOT NULL DEFAULT ('general'),
    [CreatedAt]       DATETIME      NOT NULL DEFAULT (GETDATE()),
    [UpdatedAt]       DATETIME      NOT NULL DEFAULT (GETDATE())
);
```

#### 3.1.4 ERP

Not present in these repositories. Contract only: `POST /api/labels/compile` with `client:"erp"` and either `layout:"metro"` + a camelCase `fields` bag, or `layout:"template"` + its own template JSON and PascalCase `labelData`.

---

### 3.2 Data flow today

**Design time**

```
Opti (Labels page)  ── iframe + postMessage ──►  Label Designer
   piece + configuration.labels                        │
   (buildOptiPreviewData)                              ▼
                                            template authored & saved
                                                     │
                          ┌──────────────────────────┴─────────────────────┐
                          ▼                                                ▼
              postMessage spil-label-template-saved          POST/PUT /api/templates
              (back to Opti, in-memory)                     (Print Service JSON file)
```

**Print time**

```
Opti  ── POST /api/labels/compile-batch ──►  Label Print Service  ──► TCP 9100 ──► Printer
ERP   ── POST /api/labels/compile       ──►  (layout: template | metro)
```

Opti also prints **without** the Print Service, via its own `labelTemplateToZpl.js` compiler. Two print paths exist.

---

### 3.3 Field & binding model as implemented

Three concepts, frequently conflated:

| Concept | Definition | Location |
|---|---|---|
| **Template** | Geometry (position, size, font) **plus which key goes in which box** | `template.sections.*.fields[]` |
| **Binding** | The link from one canvas element to one key | `field.value = "{{orderNumber}}"` **or** `fieldMappings[fieldKey] = { noteField, subField, isBlackBox }` |
| **Data (`labelData`)** | Real values for one piece / order | POST body at compile time; `previewData` at design time |

**Why note mappings exist:** an Opti piece carries three free-text notes × 50 slots (`note1.field1` … `note3.field50`). Which slot means "weight" versus "customer PO" is a per-project decision stored in Labels settings. Consequently keys such as `custPO`, `weight`, `area`, `services`, `marks`, `salesID` are **not piece fields** — they are note slots.

**Resolution order** — implemented three times, must stay identical:

1. `value` contains `{{token}}` → interpolate
2. `fieldMappings[key]` → `labelData.noteN.fieldM`
3. `source[]` / `fieldKey` → `labelData[key]` (case / `_` / `-` insensitive)
4. project / sheet → `size`, `glassDescription`, `itemCode`, `projectName`, …
5. `configuration.labels`
6. `""` → prints blank (never a sample, never the `***` sentinel)

| Implementation | Path |
|---|---|
| Designer canvas | `Lable Crafter/src/utils/template.js` → `resolveFieldDisplayText`, `resolveTokenForField` |
| Opti print | `spil-opti/src/utils/labelFieldResolver.js` → `resolveProjectField` |
| Print Service | `Compilation/LabelFieldResolver.cs` → `ResolveProjectField` |

**Blank sentinels.** Opti writes `"***"` / `"#####"` / `"*iiii**"` when a note mapping has no value. All three resolvers treat these as empty; the canvas must never display them.

---

### 3.4 Component → field mapping matrix

| Designer component | Binding mechanism | Opti source | ERP (template mode) | ERP (metro) |
|---|---|---|---|---|
| Text / Data Field | `{{token}}`, or note mapping | any bag key | PascalCase keys | n/a — fixed layout |
| Header | same as Text | any bag key | PascalCase keys | n/a |
| Black Box | `isBlackBox` + token | any bag key | PascalCase keys | n/a |
| Barcode | `source: ["Barcode","barcode"]` or note mapping | note mapping, else `Barcode` | `Barcode` | `barcodeValue` |
| QR Code | `source[]` or token | any bag key | PascalCase keys | n/a |
| Checkbox | **note mapping only** | `noteN.fieldM` truthy | note mapping | n/a |
| Line | decorative | — | — | n/a |
| Shape (rect / circle) | decorative | — | — | n/a |
| Shape (dxf) | decorative, geometry from OIF | `PickOifPath(labelData, configuration)` | n/a | n/a |
| Image | static path or base64 | — | — | n/a |

**Field-type printability (all three engines must agree):**

| Type | Designer canvas | Designer export | Opti compiler | Print Service |
|---|---|---|---|---|
| text, header, blackbox | ✅ | ✅ | ✅ | ✅ |
| barcode | ✅ | ✅ | ✅ | ✅ |
| qrcode | ✅ | ✅ | ✅ | ✅ |
| checkbox | ✅ | ✅ | ✅ | ✅ *(added — was missing)* |
| line | ✅ | ✅ | ✅ | ✅ |
| shape `rect` | ✅ | ✅ | ✅ | ✅ |
| shape `circle` / `ellipse` | ✅ | normalised to `circle` | ✅ | ✅ *(ellipse added)* |
| shape `dxf` | ✅ | ✅ | ✅ | ✅ |
| image | ✅ | ✅ | ✅ | ✅ |
| table | ✅ | ✅ | ❌ | ❌ → **removed from palette** |

---

### 3.5 Audit findings

Severity: **S1** blocks correct output · **S2** causes silent wrongness · **S3** maintainability / risk.

| # | Sev | Finding | Resolution |
|---|---|---|---|
| A1 | S1 | **Print Service never compiled `checkbox`.** It fell through to the text branch, so a checkbox with a note mapping printed the raw note value instead of a box. | Added a `checkbox` branch emitting `^GB` box + `^GD` X, plus `RawMappedNoteValue` and `IsCheckboxTrue` mirroring `labelCheckbox.js`. **Fixed** |
| A2 | S1 | **Opti's Labels page shipped hardcoded fake data** (`customerName: "Test customer"`, `orderNumber: "20025-1"`) as the designer's preview bag, on mount, always — so the Designer showed fake values even with a real project loaded. | Deleted the fake piece; preview now derives from the loaded project. **Fixed** |
| A3 | S1 | **Crafter token resolution lacked the `fieldMappings` fallback** the other two engines had. Real template `Standard Label (json).json` binds `{{salesID}}` → `note1.field1`; the canvas showed blank while the printer printed a value. | Added `resolveTokenForField` / `interpolateTokensForField`. Verified: **158/169** bound fields across the real customer templates now render. **Fixed** |
| A4 | S1 | **Notes stored as JSON strings** (older `.oif`, e.g. `1389.oif`) could not be read by the Opti resolver or the Print Service. | `readNoteField` (JS) and `ReadNote` (C#) now parse JSON-string notes. **Fixed** |
| A5 | S2 | **Three divergent `labelData` builders** — `PrintLabel/print.jsx`, `PrintLabel2/print.jsx`, and the designer. Any key added to one is missing from the others. | Extracted `labelPieceData.js` and used it for the designer. **The two `print.jsx` files still have inline copies — must be refactored.** |
| A6 | S2 | **`ellipse` printed as a sharp rectangle** on both engines (neither knew the type). | Designer export normalises `ellipse → circle`; both engines accept `ellipse`. **Fixed** |
| A7 | S2 | **`table` was in the palette but printable by nobody** — it would vanish silently. | Removed from the palette; `ZplPreviewPanel` now lists unprintable field types. **Fixed** |
| A8 | S2 | **`"***"` sentinels could reach the canvas**, showing text on a label that prints empty. | `isBlankish` applied in `lookupPath`, `interpolateTokens`, `hasRenderableData`. **Fixed** |
| A9 | S2 | **Print Service template library is files on disk** — single-machine, no ERP/Opti sharing, no concurrency control, no audit trail. | **Addressed by the target architecture (§4).** |
| A10 | S2 | **Two print paths.** `compileLabelsViaPrintService` has **zero callers**; Opti prints through its own compiler. Divergent output is possible between the two. | Decide in Phase P6 (§7). |
| A11 | S3 | **Catalog drift.** Three lists must agree: the Crafter offline catalog, `FieldCatalogs.cs`, and the keys the bag actually produces. No automated guard. | Lists aligned this cycle. **Needs a committed test.** |
| A12 | S3 | **ERP never sends `previewData`**, so the ERP designer always shows the empty state. | Requires ERP-side work (§9, D6). |
| A13 | S3 | **No committed automated tests** for the mapping layer. | **Phase P7.** |
| A14 | S3 | **Data hazard in the template library folder:** `LBL_006.json` and `LBL_007.json` contain 0 fields, yet `Premium Showers.json` claims `id: LBL_006` and `FMI Label new.json` claims `id: LBL_007`. Importing the empty files would wipe those labels. Also `LBL_005.json` ≡ `MSG.json` and `LBL_Json.json` ≡ `Standard Label (json).json` are byte-identical duplicates. | Operational — clean up the folder. |

### 3.6 Verification performed

| Check | Result |
|---|---|
| Real bag builder + Crafter resolver vs `1265.oif`, `1389.oif` | 32/57 catalog keys resolve with real values; remainder are genuinely unmapped note slots; 0 sentinel leaks |
| All 9 real customer templates vs the resolver (empty global Labels config) | 158/169 bound fields render real text |
| `npm run build` — Label Designer | pass |
| `npm run build` — spil-opti | pass |
| `dotnet build` — Label Print Service | pass, 0 warnings |
| `oxlint` — Label Designer | 0 errors |

---

## 4. Target Architecture

### 4.1 Principles

1. **One database.** Opti and ERP share the same MSSQL instance and the same template table, discriminated by `Client`.
2. **The Designer owns design.** Opti and ERP consume; they do not author.
3. **The Print Service is dumb and stateless.** It compiles what it is given and never owns business data.
4. **Real data only.** The Designer never invents values. No live data ⇒ no compile.
5. **One resolution algorithm.** Three copies of the rules is three chances to be wrong.

### 4.2 System context

```
┌──────────────┐        GET templates / POST set-default        ┌──────────────────┐
│  Opti        │ ────────────────────────────────────────────► │                  │
│  (Tauri exe) │                                               │   MSSQL          │
└──────┬───────┘                                               │   (shared)       │
       │                                                       │                  │
       │  launches / reads                                     │  SpilLabelTemplates
       │                                                       └────────┬─────────┘
       │  templates                          ┌──────────────────────────┘
       ▼                                     │ CRUD
┌────────────────────────────────────────────┴──────────┐
│  Label Designer  (standalone Tauri v2 exe)           │
│  React UI (unchanged)  +  Rust core (sqlx)           │
│  ┌────────────────────────────────────────────┐      │
│  │ Configure tab │ Design canvas │ Client     │      │
│  │ DB, printer   │ fields, tokens │ toggle    │      │
│  └────────────────────────────────────────────┘      │
└────────────────────────┬──────────────────────────────┘
                         │ POST /api/labels/compile
                         │ POST /api/labels/compile-batch
                         │ POST /api/labels/send
                         ▼
              ┌────────────────────────┐   TCP 9100   ┌──────────┐
              │ Label Print Service    │ ───────────► │ Printer  │
              │ (always-on service)    │              └──────────┘
              └───────────▲────────────┘
                          │ layout:"metro" | "template"
                     ┌────┴─────┐
                     │   ERP    │
                     └──────────┘
```

### 4.3 Component responsibilities

| Component | Owns | Must not |
|---|---|---|
| Label Designer | Template authoring, field binding, client toggle, DB CRUD | Query optimisation data, invent values, embed the print service |
| Label Print Service | Compiling, brand dialects, TCP delivery | Own templates, own business data, infer client from payload |
| Opti | Optimisation project, piece/sheet/notes, printing | Author label templates |
| ERP | Orders and jobs | Depend on Opti files |

### 4.4 Technology stack

| Layer | Choice | Rationale |
|---|---|---|
| Shell | **Tauri v2** (Rust) | Small exe, native file/DB access, matches the existing Opti shell |
| UI | React 19 + Vite + Tailwind 4 + Zustand + Three.js | Already built; requirement is to keep the UI |
| DB access | **sqlx (MSSQL)** from Rust | Already proven in `spil-opti/src-tauri/src/database.rs` |
| Config | `Connection.txt` beside the exe + OS credential store | Same convention as Opti |
| Compile service | ASP.NET Core (`Spil.LabelPrint.Service`) | Existing; multi-dialect (ZPL/TSPL/EZPL/SBPL/DPL/EPL) |
| Transport | Raw TCP 9100 | Printer raw-socket standard |
| DB | Microsoft SQL Server | Already in production at Opti |

### 4.5 Data model

```sql
CREATE TABLE [dbo].[SpilLabelTemplates] (
    [Id]              NVARCHAR(50)  NOT NULL,
    [Client]          NVARCHAR(10)  NOT NULL,       -- 'opti' | 'erp'
    [Name]            NVARCHAR(255) NOT NULL,
    [TemplateJson]    NVARCHAR(MAX) NOT NULL,
    [LabelType]       NVARCHAR(20)  NOT NULL CONSTRAINT DF_LT_Type DEFAULT ('production'),
    [WidthMm]         FLOAT         NULL,
    [HeightMm]        FLOAT         NULL,
    [PrinterDpi]      INT           NULL CONSTRAINT DF_LT_Dpi DEFAULT (300),
    [PrinterBrand]    NVARCHAR(20)  NULL,
    [Revision]        INT           NOT NULL CONSTRAINT DF_LT_Rev DEFAULT (1),
    [IsDefault]       BIT           NOT NULL CONSTRAINT DF_LT_Def DEFAULT (0),
    [IsDefaultOffcut] BIT           NOT NULL CONSTRAINT DF_LT_DefOC DEFAULT (0),
    [CreatedAt]       DATETIME2(3)  NOT NULL CONSTRAINT DF_LT_Created DEFAULT (SYSUTCDATETIME()),
    [UpdatedAt]       DATETIME2(3)  NOT NULL CONSTRAINT DF_LT_Updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_SpilLabelTemplates] PRIMARY KEY ([Id] ASC)
);
CREATE UNIQUE INDEX [UX_SpilLabelTemplates_Client_Default]
    ON [dbo].[SpilLabelTemplates] ([Client], [IsDefault]) WHERE [IsDefault] = 1;
CREATE INDEX [IX_SpilLabelTemplates_Client] ON [dbo].[SpilLabelTemplates] ([Client], [LabelType]);
```

**Migration from the existing table.** `SpilOptiLabelTemplates` has no `Client` column. Migration is an `ALTER TABLE … ADD Client N'opti'` plus renaming, performed by `ensure_label_templates_table` on startup — the same self-migrating pattern already used.

**Client catalogue table** (optional but recommended — removes the last hardcoded list):

```sql
CREATE TABLE [dbo].[SpilLabelFieldCatalog] (
    [Client]    NVARCHAR(10)  NOT NULL,
    [FieldKey]  NVARCHAR(100) NOT NULL,
    [Label]     NVARCHAR(255) NOT NULL,
    [Type]      NVARCHAR(20)  NOT NULL,
    [Source]    NVARCHAR(20)  NULL,   -- piece | sheet | project | notes
    [SortOrder] INT           NOT NULL DEFAULT (0),
    CONSTRAINT [PK_SpilLabelFieldCatalog] PRIMARY KEY ([Client], [FieldKey])
);
```

### 4.6 API contracts

**Designer → Print Service** (unchanged)

```http
POST /api/labels/compile
{ "client":"opti", "brand":"zebra", "layout":"template", "printerDpi":300,
  "template": { "width":100, "height":150, "sections":{...}, "fieldMappings":{...} },
  "labelData": { ... }, "configuration":{}, "project":{} }

→ 200 { "ok":true, "client":"opti", "layout":"template", "language":"zpl",
        "payload":"^XA…^XZ", "zpl":"…", "widthDots":…, "heightDots":…, "dpmm":12 }
```

`POST /api/labels/compile-batch` takes `labels: [...]` for a whole job.
`POST /api/labels/send` takes `{ host, port, compile:{…} }` or `{ host, port, payload }`.

**Designer ↔ database** (in-process, Tauri commands — mirrors Opti's existing surface)

| Command | SQL intent |
|---|---|
| `test_connection(cfg)` | `SELECT 1` |
| `list_templates(client, labelType?)` | `SELECT` by `Client` |
| `get_template(client, id)` | `SELECT` one row |
| `upsert_template(client, id, name, json, …)` | `INSERT` / `UPDATE` |
| `delete_template(client, id)` | `DELETE` guarded against deleting the default |
| `set_default_template(client, id, offcut?)` | clear current default, set one (single transaction) |

**Opti → database** is GET (list) + POST (set default) only, per R6. These commands already exist in `spil-opti/src-tauri/src/database.rs`.

### 4.7 Configuration & first run

```
App start
  └─ read Connection.txt + config.json
       ├─ valid ──► connect (pool, 5 s timeout) ──► SELECT 1 ──► Designer
       └─ missing/invalid ──► Configuration popup
            Server · Port · Database · Auth (SQL / Windows) · User · Password
            [Test connection] ──► success ──► write config ──► Designer
```

- Credentials are **never** written into `TemplateJson`; the connection file is created with restrictive permissions.
- If the password is blank, fall back to Windows integrated auth.
- The popup is reachable later from the **Configure tab**; changing the DB reloads the library.
- On DB failure the Designer opens **read-only offline mode**: authoring allowed, saving blocked with an explicit banner (Principle 4 still holds).

### 4.8 Client toggle

```
[ Opti | ERP ]   ← Configure tab, or first-run

on switch:
  1. resolve the active connection (per-client override, else the default)
  2. load field catalog for the client   (DB, else GET /api/field-catalog?client=)
  3. clear labelData — never carry one client's values into the other
  4. list templates for the client
  5. bind: {{key}} tokens + note mappings now resolve against that client's bag
```

`setClient` in `labelStore.js` already refuses a switch when a design session has locked the client; that lock must be preserved.

---

## 5. Security

| Concern | Control |
|---|---|
| DB credentials | OS credential store (Windows Credential Manager) or DPAPI-encrypted config; never in `TemplateJson`, never logged |
| SQL injection | Parameterised queries only; table/database names validated against an allow-list before interpolation |
| Template JSON | Parse with a size limit and a depth limit before rendering |
| Print Service | Bind to loopback by default; `AllowTcpSend` off unless explicitly enabled |
| Exe | Code-signed installer; Tauri CSP enabled (currently `null` in Opti — do not copy that) |

---

## 6. Testing Strategy

| Layer | Test | Gate |
|---|---|---|
| Mapping | Vitest: bag builder against checked-in `.oif` fixtures; every catalog key resolves or is provably blank | PR |
| Mapping | Vitest: each real customer template renders ≥ its bound-field count | PR |
| Mapping | Test asserting the three catalogues and the bag key set are identical | PR |
| Compile | Golden ZPL snapshots for each field type incl. checkbox checked/unchecked | PR |
| DB | Integration test against a scratch database: CRUD + set-default + client isolation | Nightly |
| E2E | Designer save → Opti list → set default → compile → assert payload | Pre-release |

---

## 7. Delivery Plan

| Phase | Work | Exit criteria |
|---|---|---|
| **P0** Harden the current web Designer | Remove fake data; block compile without live data; unify the bag builder; token→mapping fallback; sentinel suppression; catalog alignment; printability warnings | ✅ Complete this cycle |
| **P1** Shared-DB layer for the Designer | Port `database.rs` into the Designer shell; `Client` column + migration; optional catalogue table; `ensure_*` DDL | CRUD + client isolation tests green |
| **P2** Tauri shell | New `src-tauri` for the Designer reusing the existing React build; `msi` + `nsis` bundles; Rust commands replace `designApi.js` HTTP calls | Standalone exe opens, authors, saves, lists |
| **P3** Configuration | First-run popup + Configure tab (DB, printer, brand); offline read-only mode | Fresh-machine install reaches the designer in ≤ 3 steps |
| **P4** Client toggle bound to the DB | Per-client connection, catalogue load, bag clear on switch, default selection | Toggle switches library + catalogue with no value leakage |
| **P5** ERP integration | `client:"erp"` end to end: catalogue, template mode, ERP-side `previewData` | A real ERP order prints a real ERP label |
| **P6** Retire duplication | Refactor both `print.jsx` files onto `labelPieceData.js`; wire or delete `compileLabelsViaPrintService`; retire Opti's legacy label designer | One bag builder, one print path |
| **P7** Hardening | Committed test suite, code signing, telemetry, runbook, operator documentation | P0–P6 regression suite green |

**Suggested order:** P1 → P2 → P3 → P4, then P5 in parallel with P6, P7 last.

---

## 8. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Migration loses or corrupts existing templates | High | Non-destructive migration; back up `designer-templates/` and the table before cutover; keep the Print Service file library readable for one release |
| Two clients share one DB and a `Client` bug leaks templates across clients | High | Unique index + `Client` in every query; integration test asserts isolation |
| Exe cannot reach the DB on locked-down shop machines | Medium | Offline read-only mode; clear error; documented firewall/port list |
| Print Service unavailable | Medium | Designer shows an explicit "compile service unreachable" state; never silently cache payloads |
| Three resolution implementations drift again | Medium | Committed cross-engine test (§6) |
| ERP team does not send `previewData` | Medium | Phase P5 is a dependency owned outside this repo; metro path is unaffected |
| Real templates contain malformed mappings (observed: `notenull.fieldnull`, `note0.field0`, `source:[own-uuid]`) | Low | Treat `noteField ≤ 0` as unmapped; validate on import and warn |

---

## 9. Open Decisions

| # | Decision | Recommendation |
|---|---|---|
| D1 | One table with `Client`, two tables, or a table per database? | **One table with `Client`** — simplest toggle, one migration, works for N clients |
| D2 | Does the Designer read the DB directly, or ask Opti over IPC? | **Direct, via sqlx** — one code path, works when Opti is closed |
| D3 | Keep the Print Service separate or embed it in the exe? | **Keep separate** — the note says "always running service"; multi-dialect code and TCP sender do not belong in the UI process |
| D4 | DB authentication method | **Windows integrated auth** where the domain allows, SQL auth otherwise; store secrets in the OS credential store |
| D5 | What happens to the Print Service's file-based library? | **Import into the DB, keep read-only for one release** |
| D6 | Does ERP use template mode, metro, or both? | **Both** — metro for glass labels with no design file, template mode once ERP sends `previewData` |
| D7 | Offline behaviour when the DB is down | **Read-only**: browse and design, saving disabled with a banner |
| D8 | Multi-user concurrency on one template | `Revision` column + optimistic concurrency check on upsert |

---

## Appendix A — File Index

**Label Designer**
```
src/store/labelStore.js            client, labelData, sessions, CRUD hooks
src/utils/template.js              token + note resolution, export, sentinel rules
src/data/fieldCatalog.js           per-client catalogues, live-value probe
src/canvas/fieldTextures.js        per-type canvas rendering
src/elements/factories.js          field type factories
src/ui/DataFieldsPanel.jsx         catalogue with live-value indicators
src/ui/PropertiesPanel.jsx         per-type property editors
src/ui/ZplPreviewPanel.jsx         compile preview + printability warnings
src/services/printService.js       compile / send client
```

**Label Print Service**
```
Models/ApiModels.cs                          request + response contracts
Compilation/LabelCompileService.cs           template vs metro branch
Compilation/LabelFieldResolver.cs            the resolution algorithm (C#)
Compilation/TemplateZplCompiler.cs           ZPL emit incl. checkbox
Compilation/MetroZplBuilder.cs               fixed ERP glass layout
Compilation/GfaEncoder.cs                    raster for image + DXF
Compilation/PrinterTcpSender.cs              TCP 9100
Design/DesignStore.cs                        template library (files today)
Design/FieldCatalogs.cs                      per-client catalogues
Controllers/LabelsController.cs              compile / compile-batch / send
Controllers/DesignController.cs              templates + design sessions
```

**Opti**
```
src-tauri/src/database.rs                    sqlx MSSQL + SpilOptiLabelTemplates CRUD
src-tauri/Connection.txt                     connection string
src/utils/labelPieceData.js                  shared labelData bag builder
src/utils/labelDesigner.js                   designer open + preview bag
src/utils/labelFieldResolver.js              resolution algorithm (JS)
src/utils/labelTemplateToZpl.js              local ZPL compiler
src/utils/labelCheckbox.js                   checkbox truthiness + painting
src/components/PrintLabel/print.jsx          print-time bag builder (to refactor)
src/components/PrintLabel2/print.jsx         print-time bag builder (to refactor)
src/components/LabelDesigner/LabelDesignerActions.jsx   iframe host
```

## Appendix B — Glossary

| Term | Meaning |
|---|---|
| **Bag / `labelData`** | The flat object of real values for one piece or order |
| **Binding** | The link from one canvas element to one key |
| **Note mapping** | `fieldMappings[key] = { noteField, subField }` → `noteN.fieldM` |
| **Token** | `{{key}}` inside a field's text value |
| **Client** | `opti` or `erp` — selects catalogue, storage and payload shape |
| **Layout** | `template` (compile the posted template) or `metro` (fixed glass layout) |
| **Sentinel** | `***`, `#####`, `*iiii**` — "mapped but empty"; always renders blank |