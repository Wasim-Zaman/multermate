import { NextFunction, Request, Response } from 'express';
import fs from 'fs/promises';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Define your types
export interface UploadSingleOptions {
  destination?: string;
  filename?: string;
  fileTypes?: string[];
  customMimeTypes?: string[];
  fileSizeLimit?: number;
  preservePath?: boolean;
}

export interface FieldConfig {
  name: string;
  maxCount?: number;
  fileTypes?: string[];
  fileSizeLimit?: number;
}

export interface UploadMultipleOptions {
  fields: FieldConfig[];
  destination?: string;
  customMimeTypes?: string[];
  fileSizeLimit?: number;
  preservePath?: boolean;
}

// Define allowed MIME types
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
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

/**
 * Function to configure storage for Multer.
 *
 * @param destination - The destination folder where files will be stored.
 * @returns Multer storage configuration object.
 */
const configureStorage = (destination?: string) => {
  return multer.diskStorage({
    destination: (_req: Express.Request, _file: Express.Multer.File, cb) => {
      cb(null, destination || "uploads"); // Default folder is "uploads" if none is provided.
    },
    filename: (_req: Express.Request, file: Express.Multer.File, cb) => {
      const sanitizedFilename = file.originalname.replace(/\\/g, "/");
      const extension = path.extname(sanitizedFilename);
      const fieldName = file.fieldname || "file"; // Use the field name as part of the filename.
      const uniqueName = uuidv4(); // Generate a unique name using uuid.
      let fileName = `${uniqueName}-${fieldName}${extension}`;

      // Replace backslashes with forward slashes in the final filename
      fileName = fileName.replace(/\\/g, "/");

      cb(null, fileName); // Set the final filename.
    },
  });
};

/**
 * Function to configure file filter for Multer.
 *
 * @param allowedMimeTypes - Array of allowed MIME types.
 * @returns File filter function for Multer.
 */
const configureFileFilter = (allowedMimeTypes: string[]) => {
  return (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true); // Allow the file if its MIME type is allowed.
    } else {
      const error: any = new Error("Invalid file type. Only specified file types are allowed.");
      error.code = 'INVALID_FILE_TYPE';
      cb(error); // Reject the file if its MIME type is not allowed.
    }
  };
};

/**
 * Function to configure Multer with the provided options.
 *
 * @param options - Configuration options for Multer.
 * @returns Multer instance configured with the provided options.
 */
const configureMulter = ({
  destination,
  filename,
  fileTypes = [],
  customMimeTypes = [],
  fileSizeLimit,
  preservePath = false,
}: {
  destination?: string;
  filename?: string;
  fileTypes?: string[];
  customMimeTypes?: string[];
  fileSizeLimit?: number;
  preservePath?: boolean;
}) => {
  const storage = configureStorage(destination);

  // Combine allowed MIME types based on fileTypes array
  let allowedMimeTypes: string[] = [];

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
    preservePath,
  });
};

/**
 * Function to handle a single file upload.
 *
 * @param options - Configuration options for the single file upload.
 * @returns Multer middleware configured for single file upload.
 */
export function uploadSingle(options: UploadSingleOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
  // Create destination directory if it doesn't exist
  const destination = options.destination || 'uploads';
  const multerInstance = configureMulter(options);
  const middleware = multerInstance.single(options.filename || "file");
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Make sure the destination directory exists
    require('fs').mkdirSync(destination, { recursive: true });
    
    middleware(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          req.fileValidationError = 'File size limit exceeded';
        } else if (err.code === 'INVALID_FILE_TYPE') {
          req.fileValidationError = 'Invalid file type';
        } else {
          req.fileValidationError = err.message;
        }
      }
      next();
    });
  };
}

/**
 * Function to handle multiple file uploads across multiple fields.
 *
 * @param options - Configuration options for multiple file uploads.
 * @returns Multer middleware configured for multiple file uploads.
 */
export function uploadMultiple(options: UploadMultipleOptions): (req: Request, res: Response, next: NextFunction) => void {
  const destination = options.destination || 'uploads';
  
  // Map fields configuration to multer format
  const fieldConfigs = options.fields.map(field => ({
    name: field.name,
    maxCount: field.maxCount || 10, // Default maxCount is 10 if not specified.
  }));

  let allowedFileTypes: string[] = [];

  options.fields.forEach((field) => {
    const types = field.fileTypes || [];
    types.forEach((type) => {
      if (ALLOWED_MIME_TYPES[type]) {
        allowedFileTypes = allowedFileTypes.concat(ALLOWED_MIME_TYPES[type]);
      }
    });
  });

  const multerConfig = {
    destination,
    fileTypes: [],
    customMimeTypes: options.customMimeTypes || [],
    fileSizeLimit: options.fileSizeLimit,
    preservePath: options.preservePath
  };

  const multerInstance = configureMulter(multerConfig);
  const middleware = multerInstance.fields(fieldConfigs);
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Make sure the destination directory exists
    require('fs').mkdirSync(destination, { recursive: true });
    
    middleware(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          req.fileValidationError = 'File size limit exceeded';
        } else if (err.code === 'INVALID_FILE_TYPE') {
          req.fileValidationError = 'Invalid file type';
        } else {
          req.fileValidationError = err.message;
        }
      }
      next();
    });
  };
}

/**
 * Utility function to delete a file from the filesystem
 *
 * @param filePath - The path to the file that needs to be deleted
 * @returns Promise that resolves to true if deletion was successful, false otherwise
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error(`Error deleting file: ${(error as Error).message}`);
    return false;
  }
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      fileValidationError?: string;
    }
  }
}

// Export the allowed file types for reference
export const ALLOWED_FILE_TYPES = Object.keys(ALLOWED_MIME_TYPES);

// Export your functions
export default {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  ALLOWED_FILE_TYPES
}; 