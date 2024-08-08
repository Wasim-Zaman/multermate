const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

// Function to configure storage
const configureStorage = (destination, filename) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination || "uploads");
    },
    filename: (req, file, cb) => {
      const sanitizedFilename = file.originalname.replace(/\\/g, "/");
      const extension = path.extname(sanitizedFilename);
      const fieldName = filename || file.fieldname || "file";
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
  filename,
  allowedMimeTypes,
  fileSizeLimit,
}) => {
  const storage = configureStorage(destination, filename);
  const fileFilter = configureFileFilter(
    allowedMimeTypes || [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/mpeg",
      "video/ogg",
      "video/webm",
      "video/avi",
      "application/pdf",
    ]
  );

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: fileSizeLimit || 1024 * 1024 * 50 }, // Default 50MB file size limit
  });
};

// Export functions to configure multer
module.exports = {
  uploadSingle: (options = {}) => {
    const multerInstance = configureMulter(options);
    return multerInstance.single(options.filename || "file");
  },
  uploadMultiple: (options = {}) => {
    const multerInstance = configureMulter(options);
    return multerInstance.array(
      options.filename || "files",
      options.maxCount || 10
    );
  },
};
