#!/usr/bin/env node

/**
 * Test script for uploading an image to GitHub
 *
 * This creates a simple test PNG and uploads it to the gh-upload-image repository.
 *
 * Usage: node experiments/test-upload.js
 */

import fs from 'node:fs';
import { uploadImage, generateMarkdown, formatFileSize } from '../src/index.js';

// Create a minimal 1x1 PNG image (red pixel)
// This is a valid PNG file that can be uploaded
const PNG_HEADER = Buffer.from([
  0x89,
  0x50,
  0x4e,
  0x47,
  0x0d,
  0x0a,
  0x1a,
  0x0a, // PNG signature
  0x00,
  0x00,
  0x00,
  0x0d, // IHDR chunk length
  0x49,
  0x48,
  0x44,
  0x52, // "IHDR"
  0x00,
  0x00,
  0x00,
  0x01, // width: 1
  0x00,
  0x00,
  0x00,
  0x01, // height: 1
  0x08,
  0x02, // bit depth 8, color type 2 (RGB)
  0x00,
  0x00,
  0x00, // compression, filter, interlace
  0x90,
  0x77,
  0x53,
  0xde, // CRC
  0x00,
  0x00,
  0x00,
  0x0c, // IDAT chunk length
  0x49,
  0x44,
  0x41,
  0x54, // "IDAT"
  0x08,
  0xd7,
  0x63,
  0xf8,
  0xcf,
  0xc0,
  0x00,
  0x00, // zlib compressed data
  0x00,
  0x03,
  0x00,
  0x01, // ... (red pixel)
  0xa9,
  0x7e,
  0xc7,
  0x8f, // CRC
  0x00,
  0x00,
  0x00,
  0x00, // IEND chunk length
  0x49,
  0x45,
  0x4e,
  0x44, // "IEND"
  0xae,
  0x42,
  0x60,
  0x82, // CRC
]);

const testImagePath = '/tmp/test-upload.png';

async function main() {
  console.log('Creating test image...');
  fs.writeFileSync(testImagePath, PNG_HEADER);
  console.log(`Test image created: ${testImagePath}`);

  console.log('');
  console.log('Testing upload to link-foundation/gh-upload-image...');

  try {
    const result = await uploadImage({
      filePath: testImagePath,
      repository: 'link-foundation/gh-upload-image',
      verbose: true,
    });

    console.log('');
    console.log('Upload successful!');
    console.log(`URL: ${result.url}`);
    console.log(`Asset ID: ${result.assetId}`);
    console.log(`File name: ${result.fileName}`);
    console.log(`File size: ${formatFileSize(result.fileSize)}`);
    console.log(`MIME type: ${result.mimeType}`);
    console.log('');
    console.log('Markdown:');
    console.log(generateMarkdown(result, 'Test Image'));
  } catch (error) {
    console.error('');
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Cleanup
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  }
}

main();
