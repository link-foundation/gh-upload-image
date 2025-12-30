#!/usr/bin/env node

/**
 * gh-upload-image CLI
 *
 * Command-line interface for uploading images to GitHub
 */

import {
  uploadImage,
  generateMarkdown,
  getFileSize,
  formatFileSize,
  fileExists,
  ALLOWED_EXTENSIONS,
} from './index.js';

// Flag mappings for boolean options
const BOOLEAN_FLAGS = {
  '-h': 'help',
  '--help': 'help',
  '-V': 'version',
  '--version': 'version',
  '-v': 'verbose',
  '--verbose': 'verbose',
  '-d': 'dryMode',
  '--dry': 'dryMode',
  '--dry-mode': 'dryMode',
  '-m': 'markdown',
  '--markdown': 'markdown',
};

// Flag mappings for options that take values
const VALUE_FLAGS = {
  '-a': 'altText',
  '--alt': 'altText',
  '-r': 'repository',
  '--repository': 'repository',
  '--repo': 'repository',
};

/**
 * Parse command-line arguments
 * @param {string[]} args - Command-line arguments
 * @returns {Object} Parsed options
 */
function parseArgs(args) {
  const options = {
    filePath: null,
    repository: null,
    verbose: false,
    dryMode: false,
    markdown: false,
    altText: null,
    help: false,
    version: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (BOOLEAN_FLAGS[arg]) {
      options[BOOLEAN_FLAGS[arg]] = true;
    } else if (VALUE_FLAGS[arg]) {
      i++;
      options[VALUE_FLAGS[arg]] = args[i];
    } else if (!arg.startsWith('-') && !options.filePath) {
      options.filePath = arg;
    }

    i++;
  }

  return options;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
gh-upload-image - Upload images to GitHub

USAGE:
  gh-upload-image <image-file> -r <owner/repo> [options]

ARGUMENTS:
  <image-file>           Path to the image file to upload

OPTIONS:
  -r, --repo <repo>      Repository in "owner/repo" format (required)
  -m, --markdown         Output markdown format
  -a, --alt <text>       Alt text for markdown output
  -d, --dry, --dry-mode  Dry run mode - show what would be done
  -v, --verbose          Enable verbose output
  -h, --help             Show this help message
  -V, --version          Show version number

SUPPORTED FILE TYPES:
  ${ALLOWED_EXTENSIONS.join(', ')}

EXAMPLES:
  # Upload an image to a repository
  gh-upload-image screenshot.png -r owner/repo

  # Get markdown output
  gh-upload-image diagram.png -r owner/repo --markdown

  # With custom alt text
  gh-upload-image photo.jpg -r owner/repo -m -a "My Photo"

  # Dry run mode
  gh-upload-image image.gif -r owner/repo --dry

AUTHENTICATION:
  Uses the GitHub CLI (gh) for authentication.
  Make sure you are logged in with: gh auth login

NOTES:
  - Images are uploaded to GitHub's CDN and can be used in issues,
    pull requests, comments, and markdown files.
  - Both public and private repositories are supported.
  - The uploaded URL format: https://github.com/user-attachments/assets/<id>
`);
}

/**
 * Show version
 */
function showVersion() {
  console.log('0.1.0');
}

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (options.version) {
    showVersion();
    process.exit(0);
  }

  // Validate required arguments
  if (!options.filePath) {
    console.error('Error: Image file path is required');
    console.error('Usage: gh-upload-image <image-file> -r <owner/repo>');
    console.error('Run "gh-upload-image --help" for more information');
    process.exit(1);
  }

  if (!options.repository) {
    console.error('Error: Repository is required');
    console.error('Usage: gh-upload-image <image-file> -r <owner/repo>');
    console.error('Run "gh-upload-image --help" for more information');
    process.exit(1);
  }

  try {
    // Show file info
    if (fileExists(options.filePath)) {
      const fileSize = getFileSize(options.filePath);
      const dryModePrefix = options.dryMode ? '[DRY] ' : '';

      if (options.verbose) {
        console.log(`File: ${options.filePath}`);
        console.log(`Size: ${formatFileSize(fileSize)}`);
        console.log(`Repository: ${options.repository}`);
        console.log('');
      }

      console.log(
        `${dryModePrefix}Uploading ${formatFileSize(fileSize)} to ${options.repository}...`
      );
    }

    // Upload the image
    const result = await uploadImage({
      filePath: options.filePath,
      repository: options.repository,
      verbose: options.verbose,
      dryMode: options.dryMode,
    });

    // Display results
    if (result.dryMode) {
      console.log('DRY MODE: Would upload image');
      console.log(`  File: ${result.fileName}`);
      console.log(`  Size: ${formatFileSize(result.fileSize)}`);
      console.log(`  Repository: ${result.repository}`);
    } else {
      console.log('Upload successful!');

      if (options.markdown) {
        const markdown = generateMarkdown(result, options.altText);
        console.log('');
        console.log('Markdown:');
        console.log(markdown);
      } else {
        console.log(`URL: ${result.url}`);
      }

      if (options.verbose) {
        console.log('');
        console.log('Details:');
        console.log(`  Asset ID: ${result.assetId}`);
        console.log(`  File name: ${result.fileName}`);
        console.log(`  File size: ${formatFileSize(result.fileSize)}`);
        console.log(`  MIME type: ${result.mimeType}`);
        console.log(`  Repository: ${result.repository}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('Error:', error.message);

    if (options.verbose && error.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// Run the CLI
main();
