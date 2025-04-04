// ES Module entry point
export * from "./dist/esm/index.js";

// This pattern ensures better compatibility with various Node.js environments
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const multermate = require("./dist/cjs/index.js");

// Re-export everything from the CJS module
export const uploadSingle = multermate.uploadSingle;
export const uploadMultiple = multermate.uploadMultiple;
export const deleteFile = multermate.deleteFile;

// Default export
export default multermate;
