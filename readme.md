# Multer Configurator

`multer-configurator` is a flexible and customizable npm package for configuring Multer, a Node.js middleware for handling `multipart/form-data` (file uploads). This package allows you to easily configure Multer for various use cases, including storing files in different directories and specifying allowed file types.

## Features

- Customizable storage destinations
- Unique file naming using `uuid`
- Support for various file types (images, videos, PDFs, etc.)
- Configurable file size limits
- Single and multiple file uploads
- Specify custom MIME types within broader categories
- Default behavior for allowing all MIME types if none specified

## Installation

Install the package using npm:

```bash
npm install multer-configurator
```

## Usage

### Import the package

```javascript
const {
  uploadSingle,
  uploadMultiple,
  ALLOWED_FILE_TYPES,
} = require("multer-configurator");
```

### Single File Upload

```javascript
const express = require("express");
const { uploadSingle } = require("multer-configurator");

const app = express();

app.post(
  "/upload/single",
  uploadSingle({
    destination: "uploads/images",
    filename: "image",
    allowedMimeTypes: ["image/jpeg", "image/png"],
    fileSizeLimit: 1024 * 1024 * 10, // 10MB limit
  }),
  (req, res) => {
    res.send("Single file uploaded!");
  }
);

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
```

### Multiple Files Upload

```javascript
const express = require("express");
const { uploadMultiple } = require("multer-configurator");

const app = express();

app.post(
  "/upload/multiple",
  uploadMultiple({
    destination: "uploads/files",
    filename: "file",
    allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"],
    fileSizeLimit: 1024 * 1024 * 20, // 20MB limit
    maxCount: 5, // Max 5 files
  }),
  (req, res) => {
    res.send("Multiple files uploaded!");
  }
);

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
```

### Custom MIME Types (e.g., Only PNGs)

```javascript
const express = require("express");
const { uploadSingle, uploadMultiple } = require("multer-configurator");

const app = express();

// Single PNG image upload
app.post(
  "/upload-png",
  uploadSingle({ customMimeTypes: ["image/png"] }),
  (req, res) => {
    res.send("PNG image uploaded!");
  }
);

// Multiple PNG image uploads
app.post(
  "/upload-pngs",
  uploadMultiple({ customMimeTypes: ["image/png"] }),
  (req, res) => {
    res.send("PNG images uploaded!");
  }
);

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
```

### Mixed File Types (e.g., Images and PDFs)

```javascript
const express = require("express");
const { uploadSingle, uploadMultiple } = require("multer-configurator");

const app = express();

// Single image and PDF upload
app.post(
  "/upload-image-pdf",
  uploadSingle({ fileTypes: ["images", "pdfs"] }),
  (req, res) => {
    res.send("Image and PDF uploaded!");
  }
);

// Multiple images and PDFs upload
app.post(
  "/upload-images-pdfs",
  uploadMultiple({ fileTypes: ["images", "pdfs"] }),
  (req, res) => {
    res.send("Images and PDFs uploaded!");
  }
);

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
```

### Default Behavior (Allow All MIME Types)

```javascript
const express = require("express");
const { uploadSingle, uploadMultiple } = require("multer-configurator");

const app = express();

// Single file upload (default behavior allows all MIME types)
app.post("/upload", uploadSingle(), (req, res) => {
  res.send("File uploaded!");
});

// Multiple files upload (default behavior allows all MIME types)
app.post("/upload-multiple", uploadMultiple(), (req, res) => {
  res.send("Files uploaded!");
});

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
```

### Exported Constants

```javascript
const { ALLOWED_FILE_TYPES } = require("multer-configurator");
console.log(ALLOWED_FILE_TYPES); // ['images', 'videos', 'pdfs', 'all']
```

### Conclusion

multer-configurator provides a flexible and easy-to-use configuration for handling file uploads in Node.js applications. Whether you need to handle single or multiple file uploads, restrict uploads to certain file types, or specify custom MIME types, this package has you covered.
