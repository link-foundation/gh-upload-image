# gh-upload-image

Upload images to GitHub using the undocumented `/upload/policies/assets` endpoint. Works with both public and private repositories.

## Features

- **GitHub CDN hosting**: Images are uploaded to GitHub's CDN (`user-attachments/assets`)
- **Works with private repos**: Unlike manual drag-and-drop, this works for both public and private repositories
- **CLI and library**: Use as a command-line tool or import as a JavaScript/TypeScript module
- **GitHub CLI integration**: Uses `gh` CLI for authentication - no tokens to manage
- **Multi-runtime support**: Works with Node.js, Bun, and Deno
- **TypeScript support**: Full type definitions included

## Prerequisites

- [GitHub CLI (`gh`)](https://cli.github.com/) installed and authenticated
- Node.js 20.0.0 or later (or Bun/Deno)

```bash
# Verify GitHub CLI is authenticated
gh auth status
```

## Installation

```bash
# Using npm
npm install gh-upload-image

# Using bun
bun add gh-upload-image

# Using pnpm
pnpm add gh-upload-image
```

## CLI Usage

```bash
# Basic upload
gh-upload-image screenshot.png -r owner/repo

# Get markdown output
gh-upload-image diagram.png -r owner/repo --markdown

# With custom alt text
gh-upload-image photo.jpg -r owner/repo -m -a "My Photo"

# Dry run mode
gh-upload-image image.gif -r owner/repo --dry

# Verbose output
gh-upload-image screenshot.png -r owner/repo -v
```

### CLI Options

```
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
```

## Library Usage

### Basic Upload

```javascript
import { uploadImage, generateMarkdown } from 'gh-upload-image';

const result = await uploadImage({
  filePath: './screenshot.png',
  repository: 'owner/repo',
});

console.log(result.url);
// https://github.com/user-attachments/assets/abc123...

// Generate markdown
const markdown = generateMarkdown(result, 'Screenshot');
// ![Screenshot](https://github.com/user-attachments/assets/abc123...)
```

### With Options

```javascript
const result = await uploadImage({
  filePath: './image.png',
  repository: 'owner/repo',
  verbose: true, // Enable debug logging
  dryMode: false, // Set to true for testing
});
```

### Utility Functions

```javascript
import {
  fileExists,
  getFileSize,
  formatFileSize,
  getMimeType,
  isExtensionAllowed,
  parseRepository,
  ALLOWED_EXTENSIONS,
} from 'gh-upload-image';

// Check if file exists
fileExists('./image.png'); // true

// Get file size
formatFileSize(getFileSize('./image.png')); // "1.5 MB"

// Check allowed extensions
isExtensionAllowed('./image.png'); // true
isExtensionAllowed('./script.js'); // false

// Parse repository formats
parseRepository('owner/repo');
parseRepository('https://github.com/owner/repo');
parseRepository('git@github.com:owner/repo.git');
// { owner: 'owner', repo: 'repo' }
```

## Supported File Types

The following file extensions are supported:

- **Images**: `.gif`, `.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`
- **Videos**: `.mp4`, `.mov`
- **Documents**: `.pdf`, `.docx`, `.pptx`, `.xlsx`, `.txt`, `.log`
- **Archives**: `.zip`, `.gz`

## How It Works

1. The library uses the GitHub CLI (`gh`) to get an authentication token
2. It fetches the repository ID from the GitHub API
3. It requests an upload policy from GitHub's `/upload/policies/assets` endpoint
4. It uploads the file to GitHub's S3-backed storage
5. It returns the permanent CDN URL

**Note**: This library uses an undocumented GitHub API endpoint. GitHub may change or restrict access to this endpoint at any time. The endpoint may require specific authentication configurations that vary by environment.

The uploaded images are stored on GitHub's CDN and can be used in:

- Issue descriptions and comments
- Pull request descriptions and comments
- Markdown files in repositories
- GitHub Discussions

## API Reference

### `uploadImage(options)`

Upload an image to GitHub.

**Parameters:**

- `options.filePath` (string, required): Path to the image file
- `options.repository` (string, required): Repository in "owner/repo" format or GitHub URL
- `options.verbose` (boolean, default: false): Enable verbose logging
- `options.dryMode` (boolean, default: false): Dry run mode

**Returns:** `Promise<UploadResult>`

```typescript
interface UploadResult {
  url: string; // The CDN URL of the uploaded image
  assetId: string | null; // The unique asset ID
  fileName: string; // Original file name
  fileSize: number; // File size in bytes
  mimeType: string; // MIME type
  repository: string; // Repository used for upload
  dryMode: boolean; // Whether this was a dry run
}
```

### `generateMarkdown(result, altText?)`

Generate markdown for an uploaded image.

**Parameters:**

- `result` (UploadResult): The upload result
- `altText` (string, optional): Alt text for the image

**Returns:** `string` - Markdown string

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Create a changeset: `bun run changeset`
5. Commit your changes
6. Push and create a Pull Request

## License

[Unlicense](LICENSE) - Public Domain
