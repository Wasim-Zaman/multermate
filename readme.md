# Multer Mate

`multermate` is a flexible and customizable npm package for configuring Multer, a Node.js middleware for handling `multipart/form-data` (file uploads). This package allows you to easily configure Multer for various use cases, including storing files in different directories and specifying allowed file types.

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
npm install multermate
```

## Usage

### Import the package

```javascript
const {
  uploadSingle,
  uploadMultiple,
  ALLOWED_FILE_TYPES,
} = require("multermate");
```

### Single File Upload

```javascript
const express = require("express");
const { uploadSingle } = require("multermate");

const app = express();

app.post(
  "/upload/single",
  uploadSingle({
    destination: "uploads/images",
    filename: "image",
    fileTypes: ["images"],
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

### Multiple Files Upload (Mixed File Types)

```javascript
const express = require("express");
const { uploadMultiple } = require("multermate");

const app = express();

app.post(
  "/upload/multiple",
  uploadMultiple({
    fields: [
      { name: "media", maxCount: 1, fileTypes: ["images", "videos"] },
      { name: "pdf", maxCount: 1, fileTypes: ["pdfs"] },
    ],
  }),
  (req, res) => {
    res.send("Multiple files uploaded!");
  }
);

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
```

### Custom MIME Types (e.g., Only PNGs and PDFs)

```javascript
const express = require("express");
const { uploadSingle, uploadMultiple } = require("multermate");

const app = express();

// Single PNG or PDF file upload
app.post(
  "/upload-custom",
  uploadSingle({
    destination: "uploads/custom",
    customMimeTypes: ["image/png", "application/pdf"],
    fileSizeLimit: 1024 * 1024 * 15, // 15MB limit
  }),
  (req, res) => {
    res.send("PNG or PDF file uploaded!");
  }
);

// Multiple PNGs or PDFs upload
app.post(
  "/upload-custom-multiple",
  uploadMultiple({
    fields: [
      { name: "images", maxCount: 5, customMimeTypes: ["image/png"] },
      { name: "pdfs", maxCount: 2, customMimeTypes: ["application/pdf"] },
    ],
  }),
  (req, res) => {
    res.send("PNG images and PDF files uploaded!");
  }
);

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
```

### Default Behavior (Allow All MIME Types)

```javascript
const express = require("express");
const { uploadSingle, uploadMultiple } = require("multermate");

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
const { ALLOWED_FILE_TYPES } = require("multermate");
console.log(ALLOWED_FILE_TYPES); // ['images', 'videos', 'pdfs', 'all']
```

## Conclusion

multermate provides a flexible and easy-to-use configuration for handling file uploads in Node.js applications. Whether you need to handle single or multiple file uploads, restrict uploads to certain file types, or specify custom MIME types, this package has you covered.
