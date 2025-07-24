# Changelog

## [2.1.1] - 2025-01-24

### Fixed
- **Directory Creation Error**: Fixed `MultermateError: Failed to create destination directory` error that occurred in ESM environments
- **Import Issues**: Resolved module import inconsistencies between CommonJS and ESM builds that caused directory creation to fail
- **Path Resolution**: Improved path handling for nested directory structures like `public/uploads/testimonials`

### Technical Changes
- Added proper `mkdirSync` import from `fs` module for consistent behavior across all JavaScript environments
- Enhanced error messages to include more detailed information about directory creation failures
- Improved compatibility between CommonJS (`dist/cjs`) and ESM (`dist/esm`) builds

### Migration
This is a patch release with no breaking changes. Simply update to v2.1.1:
```bash
npm install multermate@2.1.1
```

## [2.1.0] - 2025-01-24

### Added
- **Universal JavaScript Compatibility**: Works with CommonJS, ES Modules, and TypeScript
- **Accept All File Types**: When no `fileTypes` specified, all file types are accepted automatically
- **Enhanced File Categories**: 14 categories with 114+ MIME types (fonts, archives, CAD, models, etc.)
- **Custom Error Handling**: New `MultermateError` class for better error management
- **Fixed Form Data Issues**: Resolved problems with multipart form processing

### Improved
- **Build System**: Dual CJS/ESM output with proper exports configuration
- **Documentation**: Comprehensive README with examples for all JavaScript environments
- **Type Definitions**: Enhanced TypeScript support with proper module declarations

### Breaking Changes
None - v2.1.0 is fully backward compatible with v2.0.x

---

For more details, see the [Migration Guide](MIGRATION.md).
