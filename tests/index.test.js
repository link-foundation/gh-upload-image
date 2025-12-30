/**
 * Tests for gh-upload-image
 * Works with Node.js, Bun, and Deno
 */

import { describe, it, expect } from 'test-anywhere';
import {
  fileExists,
  getFileSize,
  formatFileSize,
  getMimeType,
  isExtensionAllowed,
  parseRepository,
  generateMarkdown,
  ALLOWED_EXTENSIONS,
} from '../src/index.js';

describe('fileExists', () => {
  it('should return true for existing files', () => {
    expect(fileExists('./package.json')).toBe(true);
  });

  it('should return false for non-existing files', () => {
    expect(fileExists('./non-existent-file.txt')).toBe(false);
  });

  it('should return false for directories', () => {
    expect(fileExists('./src')).toBe(false);
  });
});

describe('getFileSize', () => {
  it('should return file size in bytes', () => {
    const size = getFileSize('./package.json');
    expect(typeof size).toBe('number');
    expect(size).toBeGreaterThan(0);
  });
});

describe('formatFileSize', () => {
  it('should format 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('should format bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.00 KB');
    expect(formatFileSize(2048)).toBe('2.00 KB');
  });

  it('should format megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
    expect(formatFileSize(5.5 * 1024 * 1024)).toBe('5.50 MB');
  });

  it('should format gigabytes', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
  });
});

describe('getMimeType', () => {
  it('should return correct MIME type for images', () => {
    expect(getMimeType('image.png')).toBe('image/png');
    expect(getMimeType('image.jpg')).toBe('image/jpeg');
    expect(getMimeType('image.jpeg')).toBe('image/jpeg');
    expect(getMimeType('image.gif')).toBe('image/gif');
    expect(getMimeType('image.webp')).toBe('image/webp');
    expect(getMimeType('image.svg')).toBe('image/svg+xml');
  });

  it('should return correct MIME type for documents', () => {
    expect(getMimeType('document.pdf')).toBe('application/pdf');
    expect(getMimeType('file.txt')).toBe('text/plain');
    expect(getMimeType('file.log')).toBe('text/plain');
  });

  it('should return correct MIME type for archives', () => {
    expect(getMimeType('archive.zip')).toBe('application/zip');
    expect(getMimeType('archive.gz')).toBe('application/gzip');
  });

  it('should return correct MIME type for videos', () => {
    expect(getMimeType('video.mp4')).toBe('video/mp4');
    expect(getMimeType('video.mov')).toBe('video/quicktime');
  });

  it('should be case-insensitive', () => {
    expect(getMimeType('image.PNG')).toBe('image/png');
    expect(getMimeType('image.JPG')).toBe('image/jpeg');
  });

  it('should return octet-stream for unknown types', () => {
    expect(getMimeType('file.unknown')).toBe('application/octet-stream');
  });
});

describe('isExtensionAllowed', () => {
  it('should allow image extensions', () => {
    expect(isExtensionAllowed('image.png')).toBe(true);
    expect(isExtensionAllowed('image.jpg')).toBe(true);
    expect(isExtensionAllowed('image.jpeg')).toBe(true);
    expect(isExtensionAllowed('image.gif')).toBe(true);
    expect(isExtensionAllowed('image.webp')).toBe(true);
    expect(isExtensionAllowed('image.svg')).toBe(true);
  });

  it('should allow document extensions', () => {
    expect(isExtensionAllowed('document.pdf')).toBe(true);
    expect(isExtensionAllowed('document.docx')).toBe(true);
    expect(isExtensionAllowed('document.pptx')).toBe(true);
    expect(isExtensionAllowed('document.xlsx')).toBe(true);
    expect(isExtensionAllowed('file.txt')).toBe(true);
    expect(isExtensionAllowed('file.log')).toBe(true);
  });

  it('should allow archive extensions', () => {
    expect(isExtensionAllowed('archive.zip')).toBe(true);
    expect(isExtensionAllowed('archive.gz')).toBe(true);
  });

  it('should allow video extensions', () => {
    expect(isExtensionAllowed('video.mp4')).toBe(true);
    expect(isExtensionAllowed('video.mov')).toBe(true);
  });

  it('should reject disallowed extensions', () => {
    expect(isExtensionAllowed('file.exe')).toBe(false);
    expect(isExtensionAllowed('file.js')).toBe(false);
    expect(isExtensionAllowed('file.html')).toBe(false);
    expect(isExtensionAllowed('file.sh')).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(isExtensionAllowed('image.PNG')).toBe(true);
    expect(isExtensionAllowed('image.JPG')).toBe(true);
  });
});

describe('parseRepository', () => {
  it('should parse owner/repo format', () => {
    const result = parseRepository('owner/repo');
    expect(result.owner).toBe('owner');
    expect(result.repo).toBe('repo');
  });

  it('should parse GitHub HTTPS URL', () => {
    const result = parseRepository('https://github.com/owner/repo');
    expect(result.owner).toBe('owner');
    expect(result.repo).toBe('repo');
  });

  it('should parse GitHub HTTPS URL with .git suffix', () => {
    const result = parseRepository('https://github.com/owner/repo.git');
    expect(result.owner).toBe('owner');
    expect(result.repo).toBe('repo');
  });

  it('should parse GitHub SSH URL', () => {
    const result = parseRepository('git@github.com:owner/repo.git');
    expect(result.owner).toBe('owner');
    expect(result.repo).toBe('repo');
  });

  it('should throw error for invalid format', () => {
    expect(() => parseRepository('invalid')).toThrow();
    expect(() => parseRepository('')).toThrow();
    expect(() => parseRepository('a/b/c')).toThrow();
  });
});

describe('generateMarkdown', () => {
  const mockResult = {
    url: 'https://github.com/user-attachments/assets/abc123',
    fileName: 'test-image.png',
  };

  it('should generate markdown with alt text', () => {
    const markdown = generateMarkdown(mockResult, 'My Image');
    expect(markdown).toBe(
      '![My Image](https://github.com/user-attachments/assets/abc123)'
    );
  });

  it('should use filename as alt text when not provided', () => {
    const markdown = generateMarkdown(mockResult);
    expect(markdown).toBe(
      '![test-image.png](https://github.com/user-attachments/assets/abc123)'
    );
  });

  it('should use "image" as fallback alt text', () => {
    const result = { url: 'https://example.com/image.png' };
    const markdown = generateMarkdown(result);
    expect(markdown).toBe('![image](https://example.com/image.png)');
  });
});

describe('ALLOWED_EXTENSIONS', () => {
  it('should be an array of extensions', () => {
    expect(Array.isArray(ALLOWED_EXTENSIONS)).toBe(true);
  });

  it('should contain common image extensions', () => {
    expect(ALLOWED_EXTENSIONS).toContain('.png');
    expect(ALLOWED_EXTENSIONS).toContain('.jpg');
    expect(ALLOWED_EXTENSIONS).toContain('.jpeg');
    expect(ALLOWED_EXTENSIONS).toContain('.gif');
  });

  it('should contain document extensions', () => {
    expect(ALLOWED_EXTENSIONS).toContain('.pdf');
    expect(ALLOWED_EXTENSIONS).toContain('.txt');
  });
});
