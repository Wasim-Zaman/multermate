# MulterMate v2.1.0 - Migration Guide

## What's New

MulterMate v2.1.0 is **backward compatible** with v2.0.x, but adds powerful new features:

### 🎯 Key Improvements

1. **Accept ANY File Type** - When no `fileTypes` or `customMimeTypes` are specified, ALL file types are accepted
2. **Enhanced File Categories** - 14 categories with 114+ MIME types supported
3. **Universal JavaScript Compatibility** - Works with CommonJS, ES Modules, and TypeScript
4. **Custom Error Handling** - New `MultermateError` class for better error management
5. **Fixed Form Data Issues** - Resolved problems with multipart form processing

## Migration Examples

### Before (v2.0.x)

```javascript
const { uploadSingle } = require("multermate");

// Had to specify 'all' to accept all file types
app.post(
  "/upload",
  uploadSingle({
    fileTypes: ["all"], // Required to accept all files
  }),
  (req, res) => {
    res.json({ file: req.file });
  }
);
```

### After (v2.1.0)

```javascript
const { uploadSingle } = require("multermate");

// No fileTypes = accept ALL file types automatically!
app.post("/upload", uploadSingle(), (req, res) => {
  res.json({ file: req.file });
});

// Or with destination
app.post(
  "/upload",
  uploadSingle({
    destination: "uploads/any",
    // No fileTypes needed = accepts everything!
  }),
  (req, res) => {
    res.json({ file: req.file });
  }
);
```

### New Error Handling

```javascript
const { uploadSingle, MultermateError } = require("multermate");

// Global error handler
app.use((err, req, res, next) => {
  if (err instanceof MultermateError) {
    return res.status(400).json({
      error: err.message,
      code: err.code,
      field: err.field,
    });
  }
  next(err);
});
```

### Enhanced File Categories

```javascript
// New categories available in v2.1.0
app.post(
  "/upload",
  uploadSingle({
    fileTypes: [
      "fonts", // WOFF, TTF, OTF, etc.
      "archives", // ZIP, RAR, 7Z, etc.
      "cad", // CAD files
      "models", // 3D models
      "audio", // MP3, WAV, FLAC, etc.
      "spreadsheets", // Excel, CSV
      "presentations", // PowerPoint, etc.
    ],
  }),
  handler
);
```

## Breaking Changes

❌ **None!** - v2.1.0 is fully backward compatible.

## Recommended Updates

While not required, consider these improvements:

1. **Remove `fileTypes: ['all']`** - Just omit `fileTypes` for the same effect
2. **Add error handling** - Use the new `MultermateError` class
3. **Update TypeScript imports** - New types available

## Testing Your Migration

```bash
# Install the new version
npm install multermate@2.1.0

# Test your existing code - it should work unchanged!
# Then gradually adopt new features
```

## Need Help?

- 📖 [Full Documentation](https://github.com/Wasim-Zaman/multermate#readme)
- 🐛 [Report Issues](https://github.com/Wasim-Zaman/multermate/issues)
- 💬 [Discussions](https://github.com/Wasim-Zaman/multermate/discussions)
