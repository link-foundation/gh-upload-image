#!/usr/bin/env node

/**
 * gh-upload-image - Core library for uploading images to GitHub
 *
 * This library provides functionality to upload images to GitHub using the
 * undocumented /upload/policies/assets endpoint. The uploaded images are
 * stored on GitHub's CDN (private-user-images.githubusercontent.com) and
 * can be used in issues, pull requests, comments, and markdown files.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

/**
 * Allowed file types for GitHub image upload
 */
export const ALLOWED_EXTENSIONS = [
  '.gif',
  '.jpg',
  '.jpeg',
  '.png',
  '.docx',
  '.gz',
  '.log',
  '.pdf',
  '.pptx',
  '.txt',
  '.xlsx',
  '.zip',
  '.webp',
  '.svg',
  '.mp4',
  '.mov',
];

/**
 * MIME types mapping for common file extensions
 */
const MIME_TYPES = {
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
  '.log': 'text/plain',
  '.gz': 'application/gzip',
  '.zip': 'application/zip',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
};

/**
 * Default logger implementation with configurable log levels
 * @param {Object} options - Logger options
 * @param {boolean} options.verbose - Whether to enable verbose logging
 * @param {Object} options.logger - Custom logger object (default: console)
 * @returns {Object} Logger object with log methods
 */
function createDefaultLogger(options = {}) {
  const { verbose = false, logger = console } = options;
  return {
    debug: verbose ? (msg) => logger.log(msg) : () => {},
    info: (msg) => logger.log(msg),
    warn: (msg) => (logger.warn || logger.log)(msg),
    error: (msg) => (logger.error || logger.log)(msg),
  };
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to the file
 * @returns {boolean} True if the file exists
 */
export function fileExists(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Get file size in bytes
 * @param {string} filePath - Path to the file
 * @returns {number} File size in bytes
 */
export function getFileSize(filePath) {
  return fs.statSync(filePath).size;
}

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const base = 1024;
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(base)),
    units.length - 1
  );
  const size = bytes / Math.pow(base, unitIndex);
  if (unitIndex === 0) {
    return `${size} ${units[unitIndex]}`;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Get MIME type for a file extension
 * @param {string} filePath - Path to the file
 * @returns {string} MIME type
 */
export function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Check if file extension is allowed
 * @param {string} filePath - Path to the file
 * @returns {boolean} True if the file extension is allowed
 */
export function isExtensionAllowed(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Execute a command and return its output
 * @param {string} command - Command to execute
 * @param {string[]} args - Command arguments
 * @returns {Promise<string>} Command output
 */
function execCommand(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        const errorMsg =
          stderr.trim() || `Command failed with exit code ${code}`;
        reject(new Error(errorMsg));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Get the GitHub token from gh CLI
 * @returns {Promise<string>} GitHub token
 */
export async function getGitHubToken() {
  try {
    const token = await execCommand('gh', ['auth', 'token']);
    return token;
  } catch (error) {
    throw new Error(
      `Failed to get GitHub token. Make sure you are logged in with "gh auth login". ${error.message}`
    );
  }
}

/**
 * Get repository ID from GitHub API
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<number>} Repository ID
 */
export async function getRepositoryId(owner, repo) {
  try {
    const result = await execCommand('gh', [
      'api',
      `repos/${owner}/${repo}`,
      '--jq',
      '.id',
    ]);
    return parseInt(result, 10);
  } catch (error) {
    throw new Error(
      `Failed to get repository ID for ${owner}/${repo}. Make sure the repository exists and you have access. ${error.message}`
    );
  }
}

/**
 * Parse repository string into owner and repo
 * @param {string} repository - Repository in format "owner/repo" or URL
 * @returns {{owner: string, repo: string}} Owner and repo
 */
export function parseRepository(repository) {
  // Handle GitHub URLs
  const urlMatch = repository.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2] };
  }

  // Handle owner/repo format
  const parts = repository.split('/');
  if (parts.length === 2) {
    return { owner: parts[0], repo: parts[1] };
  }

  throw new Error(
    `Invalid repository format: "${repository}". Use "owner/repo" format.`
  );
}

/**
 * Validate upload options and file
 * @param {string} filePath - Path to the file
 * @param {string} repository - Repository in "owner/repo" format
 */
function validateUploadInput(filePath, repository) {
  if (!filePath) {
    throw new Error('filePath is required in options');
  }
  if (!repository) {
    throw new Error('repository is required in options');
  }
  if (!fileExists(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }
  if (!isExtensionAllowed(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    throw new Error(
      `File extension "${ext}" is not allowed. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`
    );
  }
}

/**
 * Request upload policy from GitHub
 * @param {Object} params - Policy request parameters
 * @returns {Promise<Object>} Upload policy
 */
async function requestUploadPolicy(params) {
  const { token, repositoryId, fileName, fileSize, mimeType } = params;

  const policyParams = new URLSearchParams();
  policyParams.append('name', fileName);
  policyParams.append('size', fileSize.toString());
  policyParams.append('content_type', mimeType);
  policyParams.append('repository_id', repositoryId.toString());

  const response = await fetch('https://github.com/upload/policies/assets', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `token ${token}`,
      'User-Agent': 'gh-upload-image/0.1.0',
    },
    body: policyParams.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to get upload policy: ${response.status} ${response.statusText}. ${errorText}`
    );
  }

  return response.json();
}

/**
 * Upload file to storage using the policy
 * @param {Object} params - Upload parameters
 * @returns {Promise<void>}
 */
async function uploadFileToStorage(params) {
  const { policy, filePath, fileName, mimeType } = params;

  const fileBuffer = fs.readFileSync(filePath);
  const formData = new FormData();

  for (const [key, value] of Object.entries(policy.form)) {
    formData.append(key, value);
  }
  formData.append('file', new Blob([fileBuffer], { type: mimeType }), fileName);

  const response = await fetch(policy.upload_url, {
    method: 'POST',
    body: formData,
  });

  const isSuccess =
    response.ok || response.status === 201 || response.status === 204;

  if (!isSuccess) {
    const errorText = await response.text();
    throw new Error(
      `Failed to upload file: ${response.status} ${response.statusText}. ${errorText}`
    );
  }
}

/**
 * Upload an image to GitHub
 * @param {Object} options - Upload options
 * @param {string} options.filePath - Path to the image file
 * @param {string} options.repository - Repository in "owner/repo" format
 * @param {boolean} options.verbose - Enable verbose logging
 * @param {boolean} options.dryMode - Dry run mode
 * @param {Object} options.logger - Custom logger
 * @returns {Promise<Object>} Upload result with URL and asset ID
 */
export async function uploadImage(options = {}) {
  const {
    filePath,
    repository,
    verbose = false,
    dryMode = false,
    logger = console,
  } = options;

  validateUploadInput(filePath, repository);

  const log = createDefaultLogger({ verbose, logger });
  const { owner, repo } = parseRepository(repository);
  const fileName = path.basename(filePath);
  const fileSize = getFileSize(filePath);
  const mimeType = getMimeType(filePath);

  log.debug(`Uploading: ${fileName}`);
  log.debug(`File size: ${formatFileSize(fileSize)}`);
  log.debug(`MIME type: ${mimeType}`);
  log.debug(`Repository: ${owner}/${repo}`);

  if (dryMode) {
    return {
      url: `[DRY MODE] Would upload ${fileName} to ${owner}/${repo}`,
      assetId: null,
      fileName,
      fileSize,
      mimeType,
      repository: `${owner}/${repo}`,
      dryMode: true,
    };
  }

  log.debug('Getting GitHub token...');
  const token = await getGitHubToken();

  log.debug(`Getting repository ID for ${owner}/${repo}...`);
  const repositoryId = await getRepositoryId(owner, repo);
  log.debug(`Repository ID: ${repositoryId}`);

  log.debug('Requesting upload policy...');
  const policy = await requestUploadPolicy({
    token,
    repositoryId,
    fileName,
    fileSize,
    mimeType,
  });
  log.debug('Upload policy received');
  log.debug(`Upload URL: ${policy.upload_url}`);
  log.debug(`Asset ID: ${policy.asset?.id}`);

  log.debug('Uploading file to storage...');
  await uploadFileToStorage({ policy, filePath, fileName, mimeType });
  log.debug('File uploaded successfully');

  const assetId = policy.asset?.id;
  const url = `https://github.com/user-attachments/assets/${assetId}`;
  log.debug(`Asset URL: ${url}`);

  return {
    url,
    assetId,
    fileName,
    fileSize,
    mimeType,
    repository: `${owner}/${repo}`,
    dryMode: false,
  };
}

/**
 * Generate markdown for an uploaded image
 * @param {Object} result - Upload result from uploadImage
 * @param {string} altText - Alternative text for the image
 * @returns {string} Markdown string
 */
export function generateMarkdown(result, altText) {
  const alt = altText || result.fileName || 'image';
  return `![${alt}](${result.url})`;
}

// Default export with all functions
export default {
  uploadImage,
  generateMarkdown,
  fileExists,
  getFileSize,
  formatFileSize,
  getMimeType,
  isExtensionAllowed,
  parseRepository,
  getGitHubToken,
  getRepositoryId,
  ALLOWED_EXTENSIONS,
};
