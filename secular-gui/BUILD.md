# Building Secular for Windows

## Prerequisites
- Node.js (v18+)
- Rust (latest stable)
- On Windows: Visual Studio Build Tools

## Development
```bash
npm install
npm run tauri dev
```

## Building for Windows
```bash
npm run tauri build
```

This will create:
- **MSI installer**: `src-tauri/target/release/bundle/msi/Secular_0.1.0_x64_en-US.msi`
- **NSIS installer**: `src-tauri/target/release/bundle/nsis/Secular_0.1.0_x64-setup.exe`

## Sharing with Friends
1. Build the app using `npm run tauri build`
2. Share the `.msi` or `.exe` file from the bundle folder
3. Friends just double-click to install!

## Cross-Platform Support
- **Windows**: MSI, NSIS installers
- **macOS**: DMG bundle
- **Linux**: DEB, AppImage packages

All installers are created automatically during the build process.
