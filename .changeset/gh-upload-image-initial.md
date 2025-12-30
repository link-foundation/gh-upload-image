---
'gh-upload-image': minor
---

Initial implementation of gh-upload-image - a CLI and library for uploading images to GitHub

Features:

- Upload images to GitHub's CDN using the undocumented /upload/policies/assets endpoint
- CLI tool with markdown output support
- Library with full TypeScript definitions
- Support for images (PNG, JPG, GIF, WebP, SVG), videos (MP4, MOV), documents (PDF, DOCX, TXT), and archives (ZIP, GZ)
- Uses GitHub CLI (gh) for authentication
- Multi-runtime support (Node.js, Bun, Deno)
