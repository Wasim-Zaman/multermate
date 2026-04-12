// CommonJS entry point
try {
  module.exports = require("./dist/cjs/index.js");
} catch (error) {
  // Fallback if dist is not built yet
  throw new Error(
    'MulterMate: Please run "npm run build" to build the package before using it.'
  );
}
