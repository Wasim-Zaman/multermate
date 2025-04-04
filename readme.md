# Multer Mate

A robust and flexible file upload utility built on top of Multer, providing advanced file handling capabilities for Node.js applications. Now with full TypeScript support!

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
- 📝 Comprehensive error handling
- 🔌 Works with CommonJS, ES Modules, and TypeScript
- 📘 Full TypeScript definitions and type safety

## Installation

```bash
npm install multermate
```

## Basic Usage

### CommonJS

```javascript
const { uploadSingle, uploadMultiple, deleteFile } = require("multermate");
```

### ES Modules

```javascript
import { uploadSingle, uploadMultiple, deleteFile } from "multermate";
```

### TypeScript

```typescript
import {
  uploadSingle,
  uploadMultiple,
  deleteFile,
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

### Single File Upload

```javascript
// Basic single file upload
app.post("/upload", uploadSingle(), (req, res) => {
  res.json({ file: req.file });
});

// Advanced single file upload
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
        fileTypes: ["pdfs"],
      },
      {
        name: "media",
        maxCount: 3,
        fileTypes: ["images", "videos"],
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
    ],
    fileSizeLimit: 1024 * 1024, // 1MB
  }),
  (req, res) => {
    res.json({ file: req.file });
  }
);
```

### File Deletion

```javascript
// Simple file deletion
app.delete("/files/:filename", async (req, res) => {
  const isDeleted = await deleteFile(`uploads/${req.params.filename}`);
  res.json({ success: isDeleted });
});

// Advanced file deletion with error handling
app.delete("/files/:type/:filename", async (req, res) => {
  try {
    const filePath = path.join("uploads", req.params.type, req.params.filename);
    const isDeleted = await deleteFile(filePath);

    if (isDeleted) {
      res.json({
        success: true,
        message: "File deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "File not found or unable to delete",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
```

## API Reference

### uploadSingle(options)

Configures single file upload with the following options:

| Option          | Type     | Default   | Description            |
| --------------- | -------- | --------- | ---------------------- |
| destination     | string   | 'uploads' | Upload directory path  |
| filename        | string   | 'file'    | Form field name        |
| fileTypes       | string[] | ['all']   | Allowed file types     |
| customMimeTypes | string[] | []        | Custom MIME types      |
| fileSizeLimit   | number   | 50MB      | Max file size in bytes |
| preservePath    | boolean  | false     | Preserve original path |

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

| Option        | Type     | Default | Description           |
| ------------- | -------- | ------- | --------------------- |
| name          | string   | -       | Field name (required) |
| maxCount      | number   | 10      | Max files per field   |
| fileTypes     | string[] | ['all'] | Allowed types         |
| fileSizeLimit | number   | 50MB    | Max file size         |

### deleteFile(filePath)

Deletes a file from the filesystem:

| Parameter | Type             | Description      |
| --------- | ---------------- | ---------------- |
| filePath  | string           | Path to file     |
| Returns   | Promise<boolean> | Deletion success |

### Supported MIME Types

```javascript
const ALLOWED_MIME_TYPES = {
  images: ["image/jpeg", "image/jpg", "image/png", "image/gif"],
  videos: ["video/mp4", "video/mpeg", "video/ogg", "video/webm", "video/avi"],
  pdfs: ["application/pdf"],
  all: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "video/mp4",
    "video/mpeg",
    "video/ogg",
    "video/webm",
    "video/avi",
    "application/pdf",
  ],
};
```

## Error Handling

MulterMate adds a `fileValidationError` property to the request object when validation fails:

```javascript
app.post("/upload", uploadSingle(), (req, res) => {
  try {
    // File size validation
    if (req.fileValidationError) {
      return res.status(400).json({
        error: req.fileValidationError,
      });
    }

    // File existence check
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
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
```

## TypeScript Support

MulterMate includes complete TypeScript definitions for all functions and options:

```typescript
// Type definitions for all options
import {
  UploadSingleOptions,
  UploadMultipleOptions,
  FieldConfig,
} from "multermate";

// Using with Express and TypeScript
import express from "express";
import { uploadSingle } from "multermate";

const app = express();

app.post(
  "/upload",
  uploadSingle({
    destination: "uploads/typescript",
    fileTypes: ["images"],
    fileSizeLimit: 5 * 1024 * 1024,
  }),
  (req, res) => {
    res.json({ success: true, file: req.file });
  }
);
```

## Best Practices

1. Always implement proper error handling
2. Set appropriate file size limits
3. Validate file types on the server
4. Use custom storage destinations for different file types
5. Implement file cleanup mechanisms
6. Consider implementing file type verification beyond MIME types
7. Create upload directories if they don't exist (MulterMate does this automatically)
8. Use TypeScript types for better development experience

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Author

Wasim Zaman

## Support

For support, please open an issue in the GitHub repository: https://github.com/Wasim-Zaman/multermate
