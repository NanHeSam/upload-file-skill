---
name: sam-upload-b2
description: "[Internal provider] Upload files to Backblaze B2. Called by sam-upload-file router. Do not invoke directly for generic upload requests."
metadata:
  author: samhe
  version: "1.0.0"
---

# Backblaze B2 Upload Provider

Internal provider skill for uploading files to Backblaze B2 using the `b2` CLI.

## Prerequisites

### B2 CLI

Check if the B2 CLI is installed:

```bash
which b2
```

If not found, install it:

```bash
pipx install b2
```

Or if `pipx` is unavailable:

```bash
pip install b2
```

### Environment Variables

Check that `~/.baoyu-skills/.env` contains:

```bash
B2_APPLICATION_KEY_ID=...
B2_APPLICATION_KEY=...
B2_BUCKET=your-bucket-name
B2_PUBLIC_URL=https://f000.backblazeb2.com/file/your-bucket
```

If missing, inform the user. They can get credentials from the Backblaze B2 dashboard under App Keys.

## Upload Procedure

1. **Load env vars**:
   ```bash
   source ~/.baoyu-skills/.env
   ```

2. **Authorize** (if not already authorized in this session):
   ```bash
   source ~/.baoyu-skills/.env && b2 account authorize "$B2_APPLICATION_KEY_ID" "$B2_APPLICATION_KEY"
   ```

3. **Determine the object key**: Use `uploads/{filename}-{timestamp}.{ext}` format:
   ```bash
   FILENAME=$(basename "/path/to/file")
   EXT="${FILENAME##*.}"
   NAME="${FILENAME%.*}"
   TIMESTAMP=$(date +%s%3N)
   KEY="uploads/${NAME}-${TIMESTAMP}.${EXT}"
   ```

4. **Upload**:
   ```bash
   source ~/.baoyu-skills/.env && b2 file upload "b2://${B2_BUCKET}" "/path/to/file" "$KEY"
   ```

5. **Construct the URL**:
   ```
   ${B2_PUBLIC_URL}/${KEY}
   ```

   Return this URL to the user.

## Error Handling

| Error | Solution |
|-------|----------|
| `b2: command not found` | Run `pipx install b2` or `pip install b2` |
| `B2_*` env vars missing | Guide user to add them to `~/.baoyu-skills/.env` |
| Authorization failed | Check key ID and key are correct |
| Bucket not found | Verify `B2_BUCKET` matches an existing bucket |
| File not found | Verify the file path exists |
