# Multer Mate

A robust and flexible file upload utility built on top of Multer, providing advanced file handling capabilities for Node.js applications. Now with full TypeScript support, universal JavaScript compatibility, and comprehensive error handling!

## Features

- 📁 Flexible file storage configuration
- 🔒 Built-in file type validation
- 📦 Single and multiple file uploads
- 🎯 Field-specific file type restrictions
- 🗑️ File deletion utility
- ⚡ Configurable file size limits
- 🎨 Custom MIME type support
- 🔄 Unique file naming with UUID
- 🛡️ Path sanitization
- 📝 Comprehensive error handling with MultermateError
- 🔌 **Universal JavaScript compatibility** (CommonJS, ES Modules, TypeScript)
- 📘 Full TypeScript definitions and type safety
- 🌐 **Accept ANY file type** when no restrictions are specified
- 🎪 **Enhanced file type categories** (fonts, archives, CAD files, 3D models, etc.)
- 🚨 **Custom error classes** for better error handling
- 🔧 **Fixed form data processing** issues

## Installation

```bash
npm install multermate
```

## Universal JavaScript Compatibility

MulterMate works seamlessly across all JavaScript environments:

### CommonJS

```javascript
const {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  MultermateError,
} = require("multermate");
```

### ES Modules

```javascript
import {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  MultermateError,
} from "multermate";
```

### TypeScript

```typescript
import {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  MultermateError,
  UploadSingleOptions,
  UploadMultipleOptions,
} from "multermate";

// With type definitions
const options: UploadSingleOptions = {
  destination: "uploads/images",
  fileTypes: ["images"],
  fileSizeLimit: 5 * 1024 * 1024,
};
```

## Upload Configurations

### Accept ANY File Type

By default, when no `fileTypes` or `customMimeTypes` are specified, MulterMate accepts **ALL file types**:

```javascript
// Accept any file type - no restrictions!
app.post("/upload", uploadSingle(), (req, res) => {
  res.json({ file: req.file });
});

// Also works with destination
app.post(
  "/upload-any",
  uploadSingle({
    destination: "uploads/any-files",
    filename: "uploaded-file",
    // No fileTypes specified = accept all file types
  }),
  (req, res) => {
    res.json({ file: req.file });
  }
);
```

### Single File Upload

```javascript
// Basic single file upload
app.post("/upload", uploadSingle(), (req, res) => {
  if (req.fileValidationError) {
    return res.status(400).json({ error: req.fileValidationError });
  }
  res.json({ file: req.file });
});

// Advanced single file upload with specific file types
app.post(
  "/upload/advanced",
  uploadSingle({
    destination: "uploads/images",
    filename: "profile",
    fileTypes: ["images"],
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    preservePath: false,
  }),
  (req, res) => {
    res.json({ file: req.file });
  }
);
```

### Multiple Files Upload

```javascript
// Multiple fields with different configurations
app.post(
  "/upload/multiple",
  uploadMultiple({
    fields: [
      {
        name: "avatar",
        maxCount: 1,
        fileTypes: ["images"],
      },
      {
        name: "documents",
        maxCount: 5,
        fileTypes: ["documents", "text"],
      },
      {
        name: "any-files", // No fileTypes = accept any file type
        maxCount: 3,
      },
    ],
    destination: "uploads/mixed",
    fileSizeLimit: 10 * 1024 * 1024, // 10MB per file
  }),
  (req, res) => {
    res.json({ files: req.files });
  }
);
```

### Enhanced File Type Categories

MulterMate now supports comprehensive file type categories:

```javascript
app.post(
  "/upload-comprehensive",
  uploadSingle({
    destination: "uploads/comprehensive",
    fileTypes: [
      "images", // JPEG, PNG, GIF, WebP, SVG, etc.
      "videos", // MP4, AVI, MOV, WebM, etc.
      "audio", // MP3, WAV, FLAC, AAC, etc.
      "documents", // PDF, DOC, DOCX, XLS, XLSX, PPT, etc.
      "text", // TXT, CSV, HTML, CSS, JS, MD, etc.
      "archives", // ZIP, RAR, 7Z, TAR, GZIP, etc.
      "fonts", // WOFF, WOFF2, TTF, OTF, etc.
      "code", // JSON, XML, JS, TS, Python, etc.
      "spreadsheets", // Excel, CSV files
      "presentations", // PowerPoint, etc.
      "cad", // CAD files
      "models", // 3D model files
    ],
  }),
  (req, res) => {
    res.json({ file: req.file });
  }
);
```

### Custom MIME Types

```javascript
app.post(
  "/upload/custom",
  uploadSingle({
    destination: "uploads/custom",
    customMimeTypes: [
      "application/vnd.ms-excel",
      "application/json",
      "text/csv",
      "application/x-custom-type",
    ],
    fileSizeLimit: 1024 * 1024, // 1MB
  }),
  (req, res) => {
    res.json({ file: req.file });
  }
);
```

## Enhanced Error Handling

MulterMate now includes a custom `MultermateError` class for better error handling:

```javascript
app.post("/upload", uploadSingle(), (req, res) => {
  // Handle validation errors
  if (req.fileValidationError) {
    return res.status(400).json({
      error: req.fileValidationError,
    });
  }

  // Handle missing files
  if (!req.file) {
    return res.status(400).json({
      error: "No file uploaded",
    });
  }

  // Success response
  res.json({
    success: true,
    file: {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
});

// Global error handler for MultermateError
app.use((err, req, res, next) => {
  if (err instanceof MultermateError) {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: err.code,
      field: err.field,
    });
  }

  // Handle other errors
  res.status(500).json({
    success: false,
    error: err.message,
  });
});
```

### File Deletion with Error Handling

```javascript
const { deleteFile, MultermateError } = require("multermate");

app.delete("/files/:filename", async (req, res) => {
  try {
    await deleteFile(`uploads/${req.params.filename}`);
    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    if (error instanceof MultermateError) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete file",
    });
  }
});
```

## API Reference

### uploadSingle(options)

Configures single file upload with the following options:

| Option          | Type     | Default   | Description                                |
| --------------- | -------- | --------- | ------------------------------------------ |
| destination     | string   | 'uploads' | Upload directory path                      |
| filename        | string   | 'file'    | Form field name                            |
| fileTypes       | string[] | []        | Allowed file type categories (empty = all) |
| customMimeTypes | string[] | []        | Custom MIME types                          |
| fileSizeLimit   | number   | 50MB      | Max file size in bytes                     |
| preservePath    | boolean  | false     | Preserve original path                     |

### uploadMultiple(options)

Configures multiple file uploads with the following options:

| Option          | Type     | Default   | Description          |
| --------------- | -------- | --------- | -------------------- |
| fields          | Field[]  | []        | Field configurations |
| destination     | string   | 'uploads' | Upload directory     |
| customMimeTypes | string[] | []        | Custom MIME types    |
| fileSizeLimit   | number   | 50MB      | Max file size        |
| preservePath    | boolean  | false     | Preserve paths       |

#### Field Configuration

| Option        | Type     | Default | Description                              |
| ------------- | -------- | ------- | ---------------------------------------- |
| name          | string   | -       | Field name (required)                    |
| maxCount      | number   | 10      | Max files per field                      |
| fileTypes     | string[] | []      | Allowed types (empty = accept all types) |
| fileSizeLimit | number   | 50MB    | Max file size                            |

### deleteFile(filePath)

Deletes a file from the filesystem:

| Parameter | Type             | Description      |
| --------- | ---------------- | ---------------- |
| filePath  | string           | Path to file     |
| Returns   | Promise<boolean> | Deletion success |

### MultermateError Class

Custom error class for better error handling:

```typescript
class MultermateError extends Error {
  code?: string; // Error code (e.g., 'FILE_SIZE_LIMIT_EXCEEDED')
  field?: string; // Field name that caused the error
  storageErrors?: string[]; // Additional storage errors
}
```

### Supported File Type Categories

```javascript
const SUPPORTED_CATEGORIES = {
  images: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "...",
  ],
  videos: ["video/mp4", "video/avi", "video/mov", "video/webm", "..."],
  audio: ["audio/mp3", "audio/wav", "audio/flac", "audio/aac", "..."],
  documents: ["application/pdf", "application/msword", "..."],
  text: ["text/plain", "text/csv", "text/html", "text/markdown", "..."],
  archives: ["application/zip", "application/x-rar-compressed", "..."],
  fonts: ["font/woff", "font/woff2", "font/ttf", "font/otf", "..."],
  code: ["application/json", "text/javascript", "text/x-python", "..."],
  spreadsheets: ["application/vnd.ms-excel", "text/csv", "..."],
  presentations: ["application/vnd.ms-powerpoint", "..."],
  cad: ["application/dwg", "application/dxf", "..."],
  models: ["model/obj", "model/gltf+json", "..."],
  pdfs: ["application/pdf"], // Backward compatibility
  all: [
    /* All supported MIME types */
  ],
};
```

## What's New in v2.1.0

### 🚀 Major Improvements

- **Universal JavaScript Compatibility**: Works seamlessly with CommonJS, ES Modules, and TypeScript
- **Accept ANY File Type**: When no `fileTypes` or `customMimeTypes` are specified, ALL file types are accepted
- **Enhanced File Categories**: Added support for fonts, CAD files, 3D models, and more
- **Custom Error Handling**: Introduced `MultermateError` class for better error management
- **Fixed Form Data Issues**: Resolved problems with form data processing

### 🔧 Technical Enhancements

- Improved module exports for better compatibility
- Enhanced MIME type detection and handling
- Better error propagation and handling
- Automatic directory creation
- More robust file filtering logic

### 📁 New File Type Categories

- **Fonts**: WOFF, WOFF2, TTF, OTF, EOT
- **CAD Files**: DWG, DXF, DWF
- **3D Models**: OBJ, GLTF, STL, PLY
- **Enhanced Archives**: 7Z, XZ, LZ4, LZMA
- **More Audio Formats**: OPUS, AMR, M4A
- **Extended Video Support**: MOV, WMV, FLV, MKV

## Migration from v2.0.x

The API remains backward compatible, but you can now take advantage of new features:

```javascript
// Old way (still works)
const { uploadSingle } = require("multermate");

// New way with error handling
const { uploadSingle, MultermateError } = require("multermate");

// Accept any file type (new in v2.1.0)
app.post("/upload-any", uploadSingle(), (req, res) => {
  // No fileTypes specified = accepts ALL file types
  res.json({ file: req.file });
});
```

## TypeScript Support

MulterMate includes complete TypeScript definitions:

```typescript
import {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  MultermateError,
  UploadSingleOptions,
  UploadMultipleOptions,
  FieldConfig,
  MIME_TYPES,
  ALLOWED_FILE_TYPES,
} from "multermate";

// Type-safe configuration
const uploadOptions: UploadSingleOptions = {
  destination: "uploads/safe",
  fileTypes: ["images", "documents"],
  fileSizeLimit: 10 * 1024 * 1024,
};

// Error handling with types
try {
  await deleteFile(filePath);
} catch (error) {
  if (error instanceof MultermateError) {
    console.log(`Error ${error.code}: ${error.message}`);
  }
}
```

## Best Practices

1. **Always implement error handling** with MultermateError
2. **Set appropriate file size limits** for your use case
3. **Use specific file type restrictions** when security is important
4. **Leverage "accept any file type"** for general upload scenarios
5. **Implement proper file cleanup** mechanisms
6. **Create upload directories** beforehand (MulterMate does this automatically)
7. **Use TypeScript types** for better development experience
8. **Test with different JavaScript environments** (CommonJS, ESM, TypeScript)

## Testing

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run basic test
node test-improved.js
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Author

Wasim Zaman

## Support

For support, please open an issue in the GitHub repository: https://github.com/Wasim-Zaman/multermate
