# Multer Configurator

`multer-configurator` is a flexible and customizable npm package for configuring Multer, a Node.js middleware for handling `multipart/form-data` (file uploads). This package allows you to easily configure Multer for various use cases, including storing files in different directories and specifying allowed file types.

## Features

- Customizable storage destinations
- Unique file naming using `uuid`
- Support for various file types (images, videos, PDFs, etc.)
- Configurable file size limits
- Single and multiple file uploads

## Installation

Install the package using npm:

```bash
npm install multer-configurator
```

## Usage

### Import the package

```javascript
const { uploadSingle, uploadMultiple } = require("multer-configurator");
```

### Single file upload

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

### Multi files upload

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
