/**
 * Basic usage example for gh-upload-image
 *
 * This example demonstrates how to use the library to upload images to GitHub.
 *
 * Run with any runtime:
 * - Bun: bun examples/basic-usage.js
 * - Node.js: node examples/basic-usage.js
 * - Deno: deno run --allow-read --allow-net --allow-run examples/basic-usage.js
 */

import {
  generateMarkdown,
  formatFileSize,
  isExtensionAllowed,
  parseRepository,
  ALLOWED_EXTENSIONS,
} from '../src/index.js';

// Example 1: Check allowed extensions
console.log('Allowed file extensions:');
console.log(`  ${ALLOWED_EXTENSIONS.join(', ')}`);
console.log('');

// Example 2: Parse repository formats
console.log('Repository parsing examples:');

const formats = [
  'owner/repo',
  'https://github.com/owner/repo',
  'git@github.com:owner/repo.git',
];

for (const format of formats) {
  const parsed = parseRepository(format);
  console.log(`  "${format}"`);
  console.log(`    -> owner: ${parsed.owner}, repo: ${parsed.repo}`);
}
console.log('');

// Example 3: Check file extension
console.log('Extension validation:');
const testFiles = ['image.png', 'photo.jpg', 'script.js', 'document.pdf'];
for (const file of testFiles) {
  const allowed = isExtensionAllowed(file);
  console.log(`  ${file}: ${allowed ? 'allowed' : 'not allowed'}`);
}
console.log('');

// Example 4: Format file sizes
console.log('File size formatting:');
const sizes = [0, 500, 1024, 1024 * 1024, 1024 * 1024 * 1024];
for (const size of sizes) {
  console.log(`  ${size} bytes -> ${formatFileSize(size)}`);
}
console.log('');

// Example 5: Generate markdown (using mock result)
console.log('Markdown generation:');
const mockResult = {
  url: 'https://github.com/user-attachments/assets/example-id',
  fileName: 'screenshot.png',
};
console.log(`  Default: ${generateMarkdown(mockResult)}`);
console.log(`  With alt: ${generateMarkdown(mockResult, 'My Screenshot')}`);
console.log('');

// Example 6: Upload image (dry mode - no actual upload)
console.log('Dry mode upload example:');
console.log('  Note: This requires a valid image file and repository.');
console.log('  To test, run with: --dry-mode flag');
console.log('');

// To test actual upload, use the CLI or import uploadImage:
// import { uploadImage } from '../src/index.js';
//
// const result = await uploadImage({
//   filePath: './test-image.png',
//   repository: 'owner/repo',
//   verbose: true,
//   dryMode: true, // Set to false for actual upload
// });
//
// console.log('Upload result:');
// console.log(`  URL: ${result.url}`);
// console.log(`  File: ${result.fileName}`);
// console.log(`  Size: ${formatFileSize(result.fileSize)}`);
//
// const markdown = generateMarkdown(result, 'Test Image');
// console.log(`  Markdown: ${markdown}`);

console.log('Done!');
