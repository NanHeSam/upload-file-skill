---
name: sam-upload-vercel
description: "[Internal provider] Upload files to Vercel Blob. Called by sam-upload-file router. Do not invoke directly for generic upload requests."
metadata:
  author: samhe
  version: "1.0.0"
---

# Vercel Blob Upload Provider

Internal provider skill for uploading files to Vercel Blob storage using the `vercel` CLI.

## Prerequisites

### Vercel CLI

Check if the Vercel CLI is installed:

```bash
which vercel
```

If not found, install it:

```bash
npm i -g vercel
```

### Environment Variables

Check that `~/.baoyu-skills/.env` contains:

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

If missing, inform the user. They can get a token from the Vercel dashboard under Storage > Blob > Tokens.

## Upload Procedure

1. **Load env vars**:
   ```bash
   source ~/.baoyu-skills/.env
   ```

2. **Determine the object key**: Use `uploads/{filename}-{timestamp}.{ext}` format:
   ```bash
   FILENAME=$(basename "/path/to/file")
   EXT="${FILENAME##*.}"
   NAME="${FILENAME%.*}"
   TIMESTAMP=$(date +%s%3N)
   KEY="uploads/${NAME}-${TIMESTAMP}.${EXT}"
   ```

3. **Upload**:
   ```bash
   source ~/.baoyu-skills/.env && vercel blob put "$KEY" "/path/to/file" --token "$BLOB_READ_WRITE_TOKEN" --yes
   ```

4. **Capture the URL**: The CLI prints the blob URL directly to stdout. Extract and return it to the user.

## Error Handling

| Error | Solution |
|-------|----------|
| `vercel: command not found` | Run `npm i -g vercel` |
| `BLOB_READ_WRITE_TOKEN` missing | Guide user to add it to `~/.baoyu-skills/.env` |
| Auth error | Token may be expired or invalid; regenerate from Vercel dashboard |
| File not found | Verify the file path exists |
