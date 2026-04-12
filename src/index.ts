import { NextFunction, Request, Response } from "express";
import { mkdirSync } from "fs";
import fs from "fs/promises";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Custom error class for MulterMate
export class MultermateError extends Error {
  public code?: string;
  public field?: string;
  public storageErrors?: string[];

  constructor(message: string, code?: string, field?: string) {
    super(message);
    this.name = "MultermateError";
    this.code = code;
    this.field = field;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MultermateError);
    }
  }
}

export type UploadFileKind =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "text"
  | "archive"
  | "code"
  | "spreadsheet"
  | "presentation"
  | "font"
  | "cad"
  | "model"
  | "mix"
  | "any";

// Define your types
export interface UploadSingleOptions {
  destination?: string;
  absoluteDestination?: string;
  filename?: string;
  /**
   * Easy file category selector.
   *
   * Example: ['image'], ['document'], ['video'], or ['mix'] for common mixed uploads.
   *
   * If `customMimeTypes` is provided, this option is ignored.
   */
  fileKinds?: UploadFileKind[];
  /**
   * Backward-compatible category selector.
   *
   * Also accepts singular aliases like `image`, `document`, `video` and `mix`.
   */
  fileTypes?: string[];
  customMimeTypes?: string[];
  fileSizeLimit?: number;
  preservePath?: boolean;
}

export interface FieldConfig {
  name: string;
  maxCount?: number;
  /**
   * Easy per-field file category selector.
   */
  fileKinds?: UploadFileKind[];
  /**
   * Backward-compatible per-field category selector.
   */
  fileTypes?: string[];
  fileSizeLimit?: number;
}

export interface UploadMultipleOptions {
  fields: FieldConfig[];
  destination?: string;
  absoluteDestination?: string;
  customMimeTypes?: string[];
  fileSizeLimit?: number;
  preservePath?: boolean;
}

// Define allowed MIME types - comprehensive list including all common file types
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  // Images (all common image formats)
  images: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
    "image/tiff",
    "image/ico",
    "image/avif",
    "image/heic",
    "image/heif",
    "image/x-icon",
    "image/vnd.microsoft.icon",
  ],

  // Videos (all common video formats)
  videos: [
    "video/mp4",
    "video/mpeg",
    "video/ogg",
    "video/webm",
    "video/avi",
    "video/mov",
    "video/wmv",
    "video/flv",
    "video/mkv",
    "video/m4v",
    "video/3gp",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-ms-wmv",
    "video/x-flv",
  ],

  // Audio (all common audio formats)
  audio: [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/aac",
    "audio/flac",
    "audio/m4a",
    "audio/wma",
    "audio/mp3",
    "audio/webm",
    "audio/x-wav",
    "audio/x-m4a",
    "audio/x-aac",
    "audio/opus",
    "audio/amr",
  ],

  // Documents (all common document formats)
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/rtf",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.presentation",
    "application/vnd.apple.pages",
    "application/vnd.apple.numbers",
    "application/vnd.apple.keynote",
  ],

  // Text files (all common text formats)
  text: [
    "text/plain",
    "text/csv",
    "text/html",
    "text/css",
    "text/javascript",
    "text/xml",
    "text/markdown",
    "text/x-python",
    "text/x-java-source",
    "text/x-c",
    "text/x-c++",
    "text/x-php",
    "text/x-ruby",
    "text/x-go",
    "text/x-rust",
    "text/x-typescript",
    "text/x-swift",
    "text/x-kotlin",
    "text/x-scala",
    "text/x-perl",
    "text/x-shell",
    "text/x-sh",
    "text/x-bash",
    "text/x-yaml",
    "text/yaml",
    "text/x-toml",
    "text/x-ini",
    "text/x-log",
  ],

  // Archives (all common archive formats)
  archives: [
    "application/zip",
    "application/x-rar-compressed",
    "application/x-tar",
    "application/gzip",
    "application/x-7z-compressed",
    "application/x-bzip2",
    "application/x-xz",
    "application/x-compress",
    "application/x-lz4",
    "application/x-lzma",
    "application/vnd.rar",
  ],

  // Code files (programming language files)
  code: [
    "application/json",
    "application/xml",
    "application/javascript",
    "application/typescript",
    "text/x-python",
    "text/x-java-source",
    "text/x-c",
    "text/x-c++",
    "text/x-php",
    "text/x-ruby",
    "text/x-go",
    "text/x-rust",
    "text/x-swift",
    "text/x-kotlin",
    "text/x-scala",
    "text/x-csharp",
    "text/x-vb",
    "text/x-sql",
    "application/sql",
  ],

  // Spreadsheets (separate category)
  spreadsheets: [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "application/csv",
  ],

  // Presentations (separate category)
  presentations: [
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.oasis.opendocument.presentation",
  ],

  // Fonts (font files)
  fonts: [
    "font/woff",
    "font/woff2",
    "font/ttf",
    "font/otf",
    "font/eot",
    "application/font-woff",
    "application/font-woff2",
    "application/x-font-ttf",
    "application/x-font-otf",
    "application/vnd.ms-fontobject",
  ],

  // CAD files
  cad: [
    "application/dwg",
    "application/dxf",
    "model/vnd.dwf",
    "application/acad",
    "image/vnd.dwg",
  ],

  // 3D models
  models: [
    "model/obj",
    "model/gltf+json",
    "model/gltf-binary",
    "model/x3d+xml",
    "model/stl",
    "model/ply",
    "application/x-blender",
  ],

  // PDFs (separate category for backward compatibility)
  pdfs: ["application/pdf"],

  // All allowed types - comprehensive list (this is for backward compatibility)
  all: [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
    "image/tiff",
    "image/ico",
    "image/avif",
    "image/heic",
    "image/heif",
    "image/x-icon",
    "image/vnd.microsoft.icon",

    // Videos
    "video/mp4",
    "video/mpeg",
    "video/ogg",
    "video/webm",
    "video/avi",
    "video/mov",
    "video/wmv",
    "video/flv",
    "video/mkv",
    "video/m4v",
    "video/3gp",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-ms-wmv",
    "video/x-flv",

    // Audio
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/aac",
    "audio/flac",
    "audio/m4a",
    "audio/wma",
    "audio/mp3",
    "audio/webm",
    "audio/x-wav",
    "audio/x-m4a",
    "audio/x-aac",
    "audio/opus",
    "audio/amr",

    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/rtf",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.presentation",
    "application/vnd.apple.pages",
    "application/vnd.apple.numbers",
    "application/vnd.apple.keynote",

    // Text files
    "text/plain",
    "text/csv",
    "text/html",
    "text/css",
    "text/javascript",
    "text/xml",
    "text/markdown",
    "text/x-python",
    "text/x-java-source",
    "text/x-c",
    "text/x-c++",
    "text/x-php",
    "text/x-ruby",
    "text/x-go",
    "text/x-rust",
    "text/x-typescript",
    "text/x-swift",
    "text/x-kotlin",
    "text/x-scala",
    "text/x-perl",
    "text/x-shell",
    "text/x-sh",
    "text/x-bash",
    "text/x-yaml",
    "text/yaml",
    "text/x-toml",
    "text/x-ini",
    "text/x-log",

    // Archives
    "application/zip",
    "application/x-rar-compressed",
    "application/x-tar",
    "application/gzip",
    "application/x-7z-compressed",
    "application/x-bzip2",
    "application/x-xz",
    "application/x-compress",
    "application/x-lz4",
    "application/x-lzma",
    "application/vnd.rar",

    // Code/Data
    "application/json",
    "application/xml",
    "application/javascript",
    "application/typescript",
    "text/x-csharp",
    "text/x-vb",
    "text/x-sql",
    "application/sql",

    // Fonts
    "font/woff",
    "font/woff2",
    "font/ttf",
    "font/otf",
    "font/eot",
    "application/font-woff",
    "application/font-woff2",
    "application/x-font-ttf",
    "application/x-font-otf",
    "application/vnd.ms-fontobject",
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
    destination: (req: Express.Request, file: Express.Multer.File, cb) => {
      const dir = destination || "uploads";

      // Create directory synchronously - multer destination callback doesn't support async
      try {
        mkdirSync(dir, { recursive: true });
        cb(null, dir);
      } catch (error: any) {
        // Directory might already exist, that's okay
        if (error.code === "EEXIST") {
          cb(null, dir);
        } else {
          cb(
            new MultermateError(
              `Failed to create destination directory: ${dir}. Error: ${error.message}`,
              "DESTINATION_ERROR",
            ),
            "",
          );
        }
      }
    },
    filename: (_req: Express.Request, file: Express.Multer.File, cb) => {
      try {
        const sanitizedFilename = file.originalname.replace(/\\/g, "/");
        const extension = path.extname(sanitizedFilename);
        const fieldName = file.fieldname || "file";
        const uniqueName = uuidv4();
        let fileName = `${uniqueName}-${fieldName}${extension}`;

        // Replace backslashes with forward slashes in the final filename
        fileName = fileName.replace(/\\/g, "/");

        cb(null, fileName);
      } catch (error) {
        cb(
          new MultermateError("Failed to generate filename", "FILENAME_ERROR"),
          "",
        );
      }
    },
  });
};

const normalizePathForDb = (value: string): string => value.replace(/\\/g, "/");

const FILE_KIND_TO_CATEGORIES: Record<UploadFileKind, string[]> = {
  image: ["images"],
  video: ["videos"],
  audio: ["audio"],
  document: ["documents"],
  text: ["text"],
  archive: ["archives"],
  code: ["code"],
  spreadsheet: ["spreadsheets"],
  presentation: ["presentations"],
  font: ["fonts"],
  cad: ["cad"],
  model: ["models"],
  mix: ["images", "videos", "audio", "documents", "text", "archives"],
  any: ["all"],
};

const FILE_TYPE_ALIASES: Record<string, string[]> = {
  image: ["images"],
  images: ["images"],
  video: ["videos"],
  videos: ["videos"],
  document: ["documents"],
  documents: ["documents"],
  archive: ["archives"],
  archives: ["archives"],
  spreadsheet: ["spreadsheets"],
  spreadsheets: ["spreadsheets"],
  presentation: ["presentations"],
  presentations: ["presentations"],
  font: ["fonts"],
  fonts: ["fonts"],
  model: ["models"],
  models: ["models"],
  mixed: ["images", "videos", "audio", "documents", "text", "archives"],
  mix: ["images", "videos", "audio", "documents", "text", "archives"],
  any: ["all"],
};

const resolveAllowedMimeTypes = (
  fileTypes: string[] = [],
  fileKinds: UploadFileKind[] = [],
) => {
  const selectedCategories = new Set<string>();
  const invalidSelectors: string[] = [];

  fileKinds.forEach((kind) => {
    const categories = FILE_KIND_TO_CATEGORIES[kind];
    categories.forEach((category) => selectedCategories.add(category));
  });

  fileTypes.forEach((rawType) => {
    const normalized = String(rawType).toLowerCase();
    const aliasCategories = FILE_TYPE_ALIASES[normalized];

    if (aliasCategories) {
      aliasCategories.forEach((category) => selectedCategories.add(category));
      return;
    }

    if (ALLOWED_MIME_TYPES[normalized]) {
      selectedCategories.add(normalized);
      return;
    }

    invalidSelectors.push(rawType);
  });

  let allowedMimeTypes: string[] = [];
  selectedCategories.forEach((category) => {
    allowedMimeTypes = allowedMimeTypes.concat(
      ALLOWED_MIME_TYPES[category] || [],
    );
  });

  return {
    allowedMimeTypes: [...new Set(allowedMimeTypes)],
    invalidSelectors,
  };
};

const getPhysicalDestination = (
  destination?: string,
  absoluteDestination?: string,
): string => {
  if (!absoluteDestination) {
    return destination || "uploads";
  }

  if (!path.isAbsolute(absoluteDestination)) {
    throw new MultermateError(
      `absoluteDestination must be an absolute path. Received: ${absoluteDestination}`,
      "INVALID_ABSOLUTE_DESTINATION",
    );
  }

  const destinationSegment = (destination || "uploads").replace(/^[\\/]+/, "");
  return path.join(absoluteDestination, destinationSegment);
};

const sanitizeStoredPathsForDb = (
  req: Request,
  destination?: string,
  absoluteDestination?: string,
) => {
  if (!absoluteDestination) {
    return;
  }

  const dbDestination = normalizePathForDb(destination || "uploads");

  if (req.file) {
    req.file.destination = dbDestination;
    req.file.path = normalizePathForDb(
      path.join(dbDestination, req.file.filename),
    );
  }

  if (req.files && !Array.isArray(req.files)) {
    Object.values(req.files).forEach((files) => {
      files.forEach((file) => {
        file.destination = dbDestination;
        file.path = normalizePathForDb(path.join(dbDestination, file.filename));
      });
    });
  }
};

/**
 * Function to configure file filter for Multer.
 *
 * @param allowedMimeTypes - Array of allowed MIME types. Empty array means allow all file types.
 * @returns File filter function for Multer.
 */
const configureFileFilter = (allowedMimeTypes: string[]) => {
  return (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    try {
      // If no specific file types are restricted, allow ALL file types
      if (allowedMimeTypes.length === 0) {
        cb(null, true);
        return;
      }

      // Check if the file's MIME type is in the allowed list
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        const error = new MultermateError(
          `Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(", ")}`,
          "INVALID_FILE_TYPE",
          file.fieldname,
        );
        cb(error);
      }
    } catch (error) {
      cb(new MultermateError("File filter error", "FILTER_ERROR"));
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
  absoluteDestination,
  filename,
  fileKinds = [],
  fileTypes = [],
  customMimeTypes = [],
  fileSizeLimit,
  preservePath = false,
}: {
  destination?: string;
  absoluteDestination?: string;
  filename?: string;
  fileKinds?: UploadFileKind[];
  fileTypes?: string[];
  customMimeTypes?: string[];
  fileSizeLimit?: number;
  preservePath?: boolean;
}) => {
  try {
    const storage = configureStorage(
      getPhysicalDestination(destination, absoluteDestination),
    );

    // Combine allowed MIME types based on fileTypes array
    let allowedMimeTypes: string[] = [];

    if (customMimeTypes.length > 0) {
      // Use custom MIME types if provided
      allowedMimeTypes = customMimeTypes;
    } else if (fileTypes.length > 0 || fileKinds.length > 0) {
      const { allowedMimeTypes: resolvedMimeTypes, invalidSelectors } =
        resolveAllowedMimeTypes(fileTypes, fileKinds);

      if (invalidSelectors.length > 0) {
        throw new MultermateError(
          `Unknown file type selectors: ${invalidSelectors.join(", ")}. ` +
            `Use supported categories from ALLOWED_FILE_TYPES or fileKinds (image, document, video, mix, etc.).`,
          "INVALID_FILE_TYPE_SELECTOR",
        );
      }

      allowedMimeTypes = resolvedMimeTypes;
    }
    // If neither customMimeTypes nor fileTypes are provided, allowedMimeTypes remains empty
    // This means ALL file types are allowed (no restrictions)

    // Remove duplicates
    allowedMimeTypes = [...new Set(allowedMimeTypes)];

    const fileFilter = configureFileFilter(allowedMimeTypes);

    return multer({
      storage,
      fileFilter,
      limits: { fileSize: fileSizeLimit || 1024 * 1024 * 50 }, // Default 50MB file size limit
      preservePath,
    });
  } catch (error) {
    throw new MultermateError(
      "Failed to configure multer",
      "CONFIGURATION_ERROR",
    );
  }
};

/**
 * Function to handle a single file upload.
 *
 * @param options - Configuration options for the single file upload.
 * @returns Multer middleware configured for single file upload.
 */
export function uploadSingle(
  options: UploadSingleOptions = {},
): (req: Request, res: Response, next: NextFunction) => void {
  try {
    const storageDestination = getPhysicalDestination(
      options.destination,
      options.absoluteDestination,
    );
    const multerInstance = configureMulter(options);
    const middleware = multerInstance.single(options.filename || "file");

    return (req: Request, res: Response, next: NextFunction) => {
      // Make sure the destination directory exists
      try {
        mkdirSync(storageDestination, { recursive: true });
      } catch (error) {
        // Directory might already exist, ignore error
      }

      middleware(req, res, (err) => {
        if (err) {
          let errorMessage = "Unknown upload error";
          let errorCode = "UPLOAD_ERROR";

          if (err instanceof MultermateError) {
            // Our custom error
            req.fileValidationError = err.message;
            return next(err);
          } else if (err.code === "LIMIT_FILE_SIZE") {
            errorMessage = `File size limit exceeded. Maximum allowed size: ${options.fileSizeLimit || "50MB"}`;
            errorCode = "FILE_SIZE_LIMIT_EXCEEDED";
          } else if (err.code === "INVALID_FILE_TYPE") {
            errorMessage =
              "Invalid file type. Please check allowed file types.";
            errorCode = "INVALID_FILE_TYPE";
          } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
            errorMessage = "Unexpected field";
            errorCode = "UNEXPECTED_FIELD";
          } else {
            errorMessage = err.message || "Upload failed";
          }

          const multermateError = new MultermateError(errorMessage, errorCode);
          req.fileValidationError = errorMessage;
          return next(multermateError);
        }

        sanitizeStoredPathsForDb(
          req,
          options.destination,
          options.absoluteDestination,
        );
        next();
      });
    };
  } catch (error) {
    throw new MultermateError(
      "Failed to create upload middleware",
      "MIDDLEWARE_CREATION_ERROR",
    );
  }
}

/**
 * Function to handle multiple file uploads across multiple fields.
 *
 * @param options - Configuration options for multiple file uploads.
 * @returns Multer middleware configured for multiple file uploads.
 */
export function uploadMultiple(
  options: UploadMultipleOptions,
): (req: Request, res: Response, next: NextFunction) => void {
  try {
    const storageDestination = getPhysicalDestination(
      options.destination,
      options.absoluteDestination,
    );

    // Map fields configuration to multer format
    const fieldConfigs = options.fields.map((field) => ({
      name: field.name,
      maxCount: field.maxCount || 10, // Default maxCount is 10 if not specified.
    }));

    // Collect all allowed file types from fields
    let allowedFileTypes: string[] = [];

    if (options.customMimeTypes && options.customMimeTypes.length > 0) {
      // Use custom MIME types if provided at the global level
      allowedFileTypes = options.customMimeTypes;
    } else {
      // Collect file types from individual fields
      options.fields.forEach((field) => {
        const { allowedMimeTypes, invalidSelectors } = resolveAllowedMimeTypes(
          field.fileTypes || [],
          field.fileKinds || [],
        );

        if (invalidSelectors.length > 0) {
          throw new MultermateError(
            `Unknown file type selectors in field "${field.name}": ${invalidSelectors.join(", ")}`,
            "INVALID_FILE_TYPE_SELECTOR",
            field.name,
          );
        }

        allowedFileTypes = allowedFileTypes.concat(allowedMimeTypes);
      });
    }

    const multerConfig = {
      destination: options.destination,
      absoluteDestination: options.absoluteDestination,
      fileTypes: [],
      customMimeTypes: allowedFileTypes.length > 0 ? allowedFileTypes : [],
      fileSizeLimit: options.fileSizeLimit,
      preservePath: options.preservePath,
    };

    const multerInstance = configureMulter(multerConfig);
    const middleware = multerInstance.fields(fieldConfigs);

    return (req: Request, res: Response, next: NextFunction) => {
      // Make sure the destination directory exists
      try {
        mkdirSync(storageDestination, { recursive: true });
      } catch (error) {
        // Directory might already exist, ignore error
      }

      middleware(req, res, (err) => {
        if (err) {
          let errorMessage = "Unknown upload error";
          let errorCode = "UPLOAD_ERROR";

          if (err instanceof MultermateError) {
            // Our custom error
            req.fileValidationError = err.message;
            return next(err);
          } else if (err.code === "LIMIT_FILE_SIZE") {
            errorMessage = `File size limit exceeded. Maximum allowed size: ${options.fileSizeLimit || "50MB"}`;
            errorCode = "FILE_SIZE_LIMIT_EXCEEDED";
          } else if (err.code === "INVALID_FILE_TYPE") {
            errorMessage =
              "Invalid file type. Please check allowed file types.";
            errorCode = "INVALID_FILE_TYPE";
          } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
            errorMessage = "Unexpected field";
            errorCode = "UNEXPECTED_FIELD";
          } else if (err.code === "LIMIT_FILE_COUNT") {
            errorMessage = "Too many files";
            errorCode = "FILE_COUNT_LIMIT_EXCEEDED";
          } else {
            errorMessage = err.message || "Upload failed";
          }

          const multermateError = new MultermateError(errorMessage, errorCode);
          req.fileValidationError = errorMessage;
          return next(multermateError);
        }

        sanitizeStoredPathsForDb(
          req,
          options.destination,
          options.absoluteDestination,
        );
        next();
      });
    };
  } catch (error) {
    throw new MultermateError(
      "Failed to create multiple upload middleware",
      "MIDDLEWARE_CREATION_ERROR",
    );
  }
}

/**
 * Utility function to delete a file from the filesystem
 *
 * @param filePath - The path to the file that needs to be deleted
 * @returns Promise that resolves to true if deletion was successful, false otherwise
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    if (!filePath || typeof filePath !== "string") {
      throw new MultermateError("Invalid file path provided", "INVALID_PATH");
    }

    await fs.unlink(filePath);
    return true;
  } catch (error: any) {
    if (error instanceof MultermateError) {
      throw error;
    }

    if (error.code === "ENOENT") {
      throw new MultermateError(
        `File not found: ${filePath}`,
        "FILE_NOT_FOUND",
      );
    } else if (error.code === "EACCES") {
      throw new MultermateError(
        `Permission denied: ${filePath}`,
        "PERMISSION_DENIED",
      );
    } else {
      throw new MultermateError(
        `Failed to delete file: ${error.message}`,
        "DELETE_ERROR",
      );
    }
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

// Export MIME types for external use
export const MIME_TYPES = ALLOWED_MIME_TYPES;

// Export your functions
export default {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  MultermateError,
  ALLOWED_FILE_TYPES,
  MIME_TYPES,
};
