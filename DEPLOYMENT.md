# Label Crafter — Build & Deployment Guide

This guide describes how to build, package, and deploy **Lable Crafter** as a Windows Desktop application or as a Web Application.

---

## 1. Prerequisites

* **Node.js** (v18+ or v20+) & **Yarn** or **npm**
* For Desktop builds (Tauri):
  * **Rust & Cargo** (installed via [rustup.rs](https://rustup.rs/))
  * **Visual Studio C++ Build Tools** with Windows SDK

---

## 2. Desktop Application Release (Windows Installer / .exe)

Lable Crafter uses **Tauri v2** to package the app into a native Windows executable with an installer.

### Steps:

1. **Install Dependencies**:
   ```powershell
   yarn install
   # or: npm install
   ```

2. **Verify Code Quality**:
   ```powershell
   npm run lint
   npm test
   ```

3. **Update Version** (optional, before releasing a new version):
   * In `package.json`: bump `"version"` (e.g. `0.1.1`)
   * In `src-tauri/tauri.conf.json`: bump `"version"` (e.g. `0.1.1`)

4. **Build the Desktop App**:
   ```powershell
   yarn tauri build
   # or: npx tauri build
   ```

### Output Artifacts:
* **Installer (.exe / .msi)**:  
  `src-tauri/target/release/bundle/nsis/` or `src-tauri/target/release/bundle/msi/`
* **Direct Binary (.exe)**:  
  `src-tauri/target/release/label-designer.exe`

---

## 3. Web Application Deployment (IIS / Nginx / Static Host)

The Vite configuration is pre-configured with relative asset paths (`base: './'`), making it ready for IIS virtual directories or standard web hosting.

### Steps:

1. **Build Static Bundle**:
   ```powershell
   npm run build
   # or: yarn build
   ```

2. **Output Location**:
   * All production files will be in the `dist/` directory.

3. **Deploy to IIS**:
   * Copy the contents of `dist/` into your IIS website root or virtual directory (e.g., `C:\inetpub\wwwroot\LabelCrafter`).
   * If routing is added in the future, add a URL Rewrite rule pointing back to `index.html`.

4. **Deploy to Nginx**:
   * Copy `dist/*` to your web directory (e.g., `/var/www/label-crafter`).
   * Ensure standard static file serving with fallback:
     ```nginx
     location / {
         try_files $uri $uri/ /index.html;
     }
     ```

---

## 4. Connecting to the Print Service

By default, Lable Crafter communicates with the Label Print Service on `http://localhost:5088`.
* You can change the service endpoint anytime directly within the UI properties panel under **Print Service URL**.

