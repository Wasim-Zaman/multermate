const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

// Constants for allowed MIME types
const ALLOWED_MIME_TYPES = {
  images: ["image/jpeg", "image/png", "image/gif"],
  videos: ["video/mp4", "video/mpeg", "video/ogg", "video/webm", "video/avi"],
  pdfs: ["application/pdf"],
  all: [
    "image/jpeg",
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

// Function to configure storage
const configureStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination || "uploads");
    },
    filename: (req, file, cb) => {
      const sanitizedFilename = file.originalname.replace(/\\/g, "/");
      const extension = path.extname(sanitizedFilename);
      const fieldName = file.fieldname || "file";
      const uniqueName = uuidv4(); // Generate a unique name using uuid
      const fileName = `${uniqueName}-${fieldName}${extension}`;
      cb(null, fileName);
    },
  });
};

// Function to configure file filter
const configureFileFilter = (allowedMimeTypes) => {
  return (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only specified file types are allowed."),
        false
      );
    }
  };
};

// Function to configure multer
const configureMulter = ({
  destination,
  fileTypes = [],
  customMimeTypes = [],
  fileSizeLimit,
}) => {
  const storage = configureStorage(destination);

  // Combine allowed MIME types based on fileTypes array
  let allowedMimeTypes = [];

  if (customMimeTypes.length > 0) {
    // Use custom MIME types if provided
    allowedMimeTypes = customMimeTypes;
  } else {
    // Use default MIME types for specified fileTypes
    fileTypes.forEach((type) => {
      if (ALLOWED_MIME_TYPES[type]) {
        allowedMimeTypes = allowedMimeTypes.concat(ALLOWED_MIME_TYPES[type]);
      }
    });

    // If no specific file types are provided, use all allowed MIME types
    if (allowedMimeTypes.length === 0) {
      allowedMimeTypes = ALLOWED_MIME_TYPES.all;
    }
  }

  const fileFilter = configureFileFilter(allowedMimeTypes);

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: fileSizeLimit || 1024 * 1024 * 50 }, // Default 50MB file size limit
  });
};

// Function to handle multiple fields
const uploadFields = (fields) => {
  const fieldConfigs = fields.map((field) => ({
    name: field.name,
    maxCount: field.maxCount || 10,
  }));

  let allowedFileTypes = [];

  fields.forEach((field) => {
    const types = field.fileTypes || [];
    types.forEach((type) => {
      if (ALLOWED_MIME_TYPES[type]) {
        allowedFileTypes = allowedFileTypes.concat(ALLOWED_MIME_TYPES[type]);
      }
    });
  });

  const multerInstance = configureMulter({
    fileTypes: allowedFileTypes,
    customMimeTypes: [],
    fileSizeLimit: fields[0]?.fileSizeLimit, // Assuming all fields share the same limit
  });

  return multerInstance.fields(fieldConfigs);
};

// Export functions to configure multer and available file types
module.exports = {
  uploadSingle: (options = {}) => {
    const multerInstance = configureMulter(options);
    return multerInstance.single(options.filename || "file");
  },
  uploadMultiple: (options = {}) => {
    const multerInstance = configureMulter(options);
    return multerInstance.fields(options.fields || []);
  },
  ALLOWED_FILE_TYPES: Object.keys(ALLOWED_MIME_TYPES),
};
