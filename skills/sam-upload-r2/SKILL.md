---
name: sam-upload-r2
description: "[Internal provider] Upload files to Cloudflare R2. Called by sam-upload-file router. Do not invoke directly for generic upload requests."
metadata:
  author: samhe
  version: "1.0.0"
---

# Cloudflare R2 Upload Provider

Internal provider skill for uploading files to Cloudflare R2 via the existing TypeScript script.

## Prerequisites

### Environment Variables

Check that `~/.baoyu-skills/.env` contains:

```bash
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET=your-bucket-name
R2_PUBLIC_URL=https://your-public-domain.com
```

If any are missing, inform the user and guide them to set up R2 credentials.

### Dependencies

Before uploading, ensure dependencies are installed:

```bash
cd ${SKILL_DIR}/../sam-upload-file/scripts && bun install
```

Only run `bun install` if `node_modules` doesn't exist or looks incomplete.

## Upload Procedure

1. **Verify setup**: Check that `~/.baoyu-skills/.env` has the `R2_*` variables and that `${SKILL_DIR}/../sam-upload-file/scripts/node_modules` exists.

2. **Run upload**:
   ```bash
   cd ${SKILL_DIR}/../sam-upload-file/scripts && bun main.ts --file /absolute/path/to/file --json
   ```

3. **Parse output**: The script outputs JSON:
   ```json
   {
     "url": "https://your-domain.com/uploads/filename-1705123456789.ext",
     "key": "uploads/filename-1705123456789.ext",
     "bucket": "your-bucket",
     "size": 12345
   }
   ```

4. **Return the `url`** value to the user.

## Custom Key

To upload with a custom object key:

```bash
cd ${SKILL_DIR}/../sam-upload-file/scripts && bun main.ts --file /path/to/file --key custom/path/file.ext --json
```

## Error Handling

| Error | Solution |
|-------|----------|
| `R2_*` env vars missing | Guide user to add them to `~/.baoyu-skills/.env` |
| `bun: command not found` | Install bun: `curl -fsSL https://bun.sh/install \| bash` |
| File not found | Verify the file path exists |
| Upload failed | Check R2 credentials and bucket permissions |
