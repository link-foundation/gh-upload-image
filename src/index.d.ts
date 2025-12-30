/**
 * gh-upload-image - TypeScript definitions
 *
 * Upload images to GitHub using the undocumented /upload/policies/assets endpoint.
 */

/**
 * Allowed file extensions for GitHub image upload
 */
export declare const ALLOWED_EXTENSIONS: readonly string[];

/**
 * Options for uploading an image
 */
export interface UploadImageOptions {
  /**
   * Path to the image file to upload
   */
  filePath: string;

  /**
   * Repository in "owner/repo" format or GitHub URL
   */
  repository: string;

  /**
   * Enable verbose logging
   * @default false
   */
  verbose?: boolean;

  /**
   * Dry run mode - show what would be done without uploading
   * @default false
   */
  dryMode?: boolean;

  /**
   * Custom logger object
   * @default console
   */
  logger?: {
    log: (message: string) => void;
    warn?: (message: string) => void;
    error?: (message: string) => void;
    debug?: (message: string) => void;
  };
}

/**
 * Result of an image upload
 */
export interface UploadResult {
  /**
   * The URL of the uploaded image on GitHub's CDN
   */
  url: string;

  /**
   * The unique asset ID
   */
  assetId: string | null;

  /**
   * The original file name
   */
  fileName: string;

  /**
   * The file size in bytes
   */
  fileSize: number;

  /**
   * The MIME type of the file
   */
  mimeType: string;

  /**
   * The repository where the image was uploaded
   */
  repository: string;

  /**
   * Whether this was a dry run
   */
  dryMode: boolean;
}

/**
 * Parsed repository information
 */
export interface ParsedRepository {
  owner: string;
  repo: string;
}

/**
 * Upload an image to GitHub
 *
 * @param options - Upload options
 * @returns Promise resolving to the upload result
 *
 * @example
 * ```javascript
 * import { uploadImage } from 'gh-upload-image';
 *
 * const result = await uploadImage({
 *   filePath: './screenshot.png',
 *   repository: 'owner/repo',
 * });
 *
 * console.log(result.url);
 * // https://github.com/user-attachments/assets/abc123...
 * ```
 */
export declare function uploadImage(
  options: UploadImageOptions
): Promise<UploadResult>;

/**
 * Generate markdown for an uploaded image
 *
 * @param result - The upload result from uploadImage
 * @param altText - Alternative text for the image (optional)
 * @returns Markdown string for embedding the image
 *
 * @example
 * ```javascript
 * const markdown = generateMarkdown(result, 'Screenshot');
 * // ![Screenshot](https://github.com/user-attachments/assets/abc123...)
 * ```
 */
export declare function generateMarkdown(
  result: UploadResult,
  altText?: string
): string;

/**
 * Check if a file exists
 *
 * @param filePath - Path to the file
 * @returns True if the file exists and is a file
 */
export declare function fileExists(filePath: string): boolean;

/**
 * Get file size in bytes
 *
 * @param filePath - Path to the file
 * @returns File size in bytes
 */
export declare function getFileSize(filePath: string): number;

/**
 * Format file size in human readable format
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export declare function formatFileSize(bytes: number): string;

/**
 * Get MIME type for a file based on its extension
 *
 * @param filePath - Path to the file
 * @returns MIME type string
 */
export declare function getMimeType(filePath: string): string;

/**
 * Check if a file extension is allowed for upload
 *
 * @param filePath - Path to the file
 * @returns True if the extension is allowed
 */
export declare function isExtensionAllowed(filePath: string): boolean;

/**
 * Parse a repository string into owner and repo
 *
 * @param repository - Repository in "owner/repo" format or GitHub URL
 * @returns Parsed repository with owner and repo
 * @throws Error if the format is invalid
 */
export declare function parseRepository(repository: string): ParsedRepository;

/**
 * Get the GitHub token from gh CLI
 *
 * @returns Promise resolving to the GitHub token
 * @throws Error if not logged in or gh CLI is not available
 */
export declare function getGitHubToken(): Promise<string>;

/**
 * Get repository ID from GitHub API
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @returns Promise resolving to the repository ID
 * @throws Error if repository not found or access denied
 */
export declare function getRepositoryId(
  owner: string,
  repo: string
): Promise<number>;

/**
 * Default export with all functions
 */
declare const _default: {
  uploadImage: typeof uploadImage;
  generateMarkdown: typeof generateMarkdown;
  fileExists: typeof fileExists;
  getFileSize: typeof getFileSize;
  formatFileSize: typeof formatFileSize;
  getMimeType: typeof getMimeType;
  isExtensionAllowed: typeof isExtensionAllowed;
  parseRepository: typeof parseRepository;
  getGitHubToken: typeof getGitHubToken;
  getRepositoryId: typeof getRepositoryId;
  ALLOWED_EXTENSIONS: typeof ALLOWED_EXTENSIONS;
};

export default _default;
