---
name: sam-upload-file
description: Upload files to cloud storage (Cloudflare R2, Vercel Blob, Backblaze B2, AWS S3). Supports any file type. Returns public URL. Use when you need to upload local files to cloud storage for sharing or embedding.
metadata:
  author: samhe
  version: "1.0.0"
---

# File Upload Skill (Multi-Provider Router)

Upload any file to cloud storage and get a public URL. Supports multiple storage providers.

## Supported Providers

| Provider | Skill | CLI/Tool |
|----------|-------|----------|
| Cloudflare R2 | `/sam-upload-r2` | TypeScript script (bun) |
| Vercel Blob | `/sam-upload-vercel` | `vercel` CLI |
| Backblaze B2 | `/sam-upload-b2` | `b2` CLI |
| AWS S3 | `/sam-upload-s3` | `aws` CLI |

## Provider Selection

### 1. Check for explicit override

If the user says something like "upload to S3" or "upload to Vercel Blob", skip the saved preference and delegate directly to the matching provider skill.

Keyword mapping:
- "r2" or "cloudflare" → `/sam-upload-r2`
- "vercel" or "blob" → `/sam-upload-vercel`
- "b2" or "backblaze" → `/sam-upload-b2`
- "s3" or "aws" → `/sam-upload-s3`

### 2. Read saved preference

Read `~/.baoyu-skills/upload-config.json`:

```bash
cat ~/.baoyu-skills/upload-config.json 2>/dev/null
```

Expected format:
```json
{"defaultProvider": "r2"}
```

Valid values for `defaultProvider`: `r2`, `vercel`, `b2`, `s3`

If the file exists and has a valid provider, delegate to that provider's skill.

### 3. First-run: ask user to choose

If `upload-config.json` doesn't exist or has no valid provider, ask the user which provider they want to use:

> Which cloud storage provider would you like to use for file uploads?
> 1. Cloudflare R2
> 2. Vercel Blob
> 3. Backblaze B2
> 4. AWS S3

Save their choice:

```bash
mkdir -p ~/.baoyu-skills && echo '{"defaultProvider": "CHOICE"}' > ~/.baoyu-skills/upload-config.json
```

Then delegate to the chosen provider's skill.

## Delegation

Once a provider is selected, delegate by invoking the corresponding skill:

- R2 → use instructions from `/sam-upload-r2`
- Vercel → use instructions from `/sam-upload-vercel`
- B2 → use instructions from `/sam-upload-b2`
- S3 → use instructions from `/sam-upload-s3`

Read the provider's SKILL.md and follow its upload procedure.

## Changing Provider

If the user says "change provider", "switch provider", "use a different storage", or similar:

1. Show the provider list (as in first-run)
2. Save the new choice to `~/.baoyu-skills/upload-config.json`
3. Confirm the change

## Supported File Types

- **Images**: PNG, JPG, JPEG, GIF, WebP, SVG, ICO, BMP, TIFF
- **Videos**: MP4, WebM, MOV, AVI, MKV
- **Audio**: MP3, WAV, OGG, FLAC, M4A
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **Text**: TXT, MD, HTML, CSS, JS, JSON, XML
- **Archives**: ZIP, TAR, GZ, RAR, 7Z
- **Other**: Any file (uploaded as `application/octet-stream`)
