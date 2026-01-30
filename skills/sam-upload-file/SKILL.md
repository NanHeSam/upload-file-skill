---
name: sam-upload-file
description: Upload files to cloud storage and get a public URL. Supports Cloudflare R2, Vercel Blob, Backblaze B2, and AWS S3. Remembers your provider preference. Use when you need to upload local files for sharing or embedding.
metadata:
  author: samhe
  version: "1.0.0"
---

# File Upload Skill

Upload any file to cloud storage and get a public URL.

## Provider Selection

### 1. Check for explicit override

If the user mentions a specific provider (e.g. "upload to S3", "upload to Vercel"), skip the saved preference and use that provider directly.

Keyword mapping:
- "r2" or "cloudflare" → R2
- "vercel" or "blob" → Vercel Blob
- "b2" or "backblaze" → Backblaze B2
- "s3" or "aws" → AWS S3

### 2. Read saved preference

```bash
cat ~/.baoyu-skills/upload-config.json 2>/dev/null
```

Expected format: `{"defaultProvider": "r2"}` — valid values: `r2`, `vercel`, `b2`, `s3`

If a valid provider is saved, use it.

### 3. First run — ask the user

If no preference is saved, ask:

> Which cloud storage provider would you like to use?
> 1. Cloudflare R2
> 2. Vercel Blob
> 3. Backblaze B2
> 4. AWS S3

Save the choice:

```bash
mkdir -p ~/.baoyu-skills && echo '{"defaultProvider": "CHOICE"}' > ~/.baoyu-skills/upload-config.json
```

### 4. Changing provider

If the user says "change provider", "switch provider", or similar, show the list again, save the new choice, and confirm.

---

## Provider: Cloudflare R2

### Setup

Credentials in `~/.baoyu-skills/.env`:

```bash
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET=your-bucket-name
R2_PUBLIC_URL=https://your-public-domain.com
```

If any are missing, tell the user which variables to add and where to find them in the Cloudflare dashboard (R2 > Manage API Tokens).

Dependencies (only if `${SKILL_DIR}/scripts/node_modules` doesn't exist):

```bash
cd ${SKILL_DIR}/scripts && bun install
```

### Upload

```bash
cd ${SKILL_DIR}/scripts && bun main.ts --file /absolute/path/to/file --json
```

With a custom key:

```bash
cd ${SKILL_DIR}/scripts && bun main.ts --file /path/to/file --key custom/path/file.ext --json
```

Output:

```json
{
  "url": "https://your-domain.com/uploads/filename-1705123456789.ext",
  "key": "uploads/filename-1705123456789.ext",
  "bucket": "your-bucket",
  "size": 12345
}
```

Return the `url` to the user.

---

## Provider: Vercel Blob

### Setup

Check CLI: `which vercel` — if missing: `npm i -g vercel`

Credentials in `~/.baoyu-skills/.env`:

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

If missing, tell the user to get a token from the Vercel dashboard under Storage > Blob > Tokens.

### Upload

```bash
FILENAME=$(basename "/path/to/file")
EXT="${FILENAME##*.}"
NAME="${FILENAME%.*}"
TIMESTAMP=$(date +%s%3N)
KEY="uploads/${NAME}-${TIMESTAMP}.${EXT}"

source ~/.baoyu-skills/.env && vercel blob put "$KEY" "/path/to/file" --token "$BLOB_READ_WRITE_TOKEN" --yes
```

The CLI prints the blob URL to stdout. Return it to the user.

---

## Provider: Backblaze B2

### Setup

Check CLI: `which b2` — if missing: `pipx install b2` (or `pip install b2`)

Credentials in `~/.baoyu-skills/.env`:

```bash
B2_APPLICATION_KEY_ID=...
B2_APPLICATION_KEY=...
B2_BUCKET=your-bucket-name
B2_PUBLIC_URL=https://f000.backblazeb2.com/file/your-bucket
```

If missing, tell the user to get credentials from the Backblaze B2 dashboard under App Keys.

### Upload

```bash
source ~/.baoyu-skills/.env
b2 account authorize "$B2_APPLICATION_KEY_ID" "$B2_APPLICATION_KEY"

FILENAME=$(basename "/path/to/file")
EXT="${FILENAME##*.}"
NAME="${FILENAME%.*}"
TIMESTAMP=$(date +%s%3N)
KEY="uploads/${NAME}-${TIMESTAMP}.${EXT}"

b2 file upload "b2://${B2_BUCKET}" "/path/to/file" "$KEY"
```

Construct URL: `${B2_PUBLIC_URL}/${KEY}` — return it to the user.

---

## Provider: AWS S3

### Setup

Check CLI: `which aws` — if missing: `brew install awscli`

Credentials in `~/.baoyu-skills/.env`:

```bash
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
AWS_S3_PUBLIC_URL=https://your-custom-domain.com
```

`AWS_S3_PUBLIC_URL` is optional. If not set, use: `https://{bucket}.s3.{region}.amazonaws.com/{key}`

### Upload

```bash
FILENAME=$(basename "/path/to/file")
EXT="${FILENAME##*.}"
NAME="${FILENAME%.*}"
TIMESTAMP=$(date +%s%3N)
KEY="uploads/${NAME}-${TIMESTAMP}.${EXT}"

source ~/.baoyu-skills/.env && aws s3 cp "/path/to/file" "s3://${AWS_S3_BUCKET}/${KEY}" --region "$AWS_S3_REGION"
```

Construct URL: `${AWS_S3_PUBLIC_URL}/${KEY}` (or standard S3 URL if no custom domain). Return it to the user.

---

## Supported File Types

Images, videos, audio, documents, text, archives, and any other file type.

## Error Handling

For any provider, if setup is incomplete (missing CLI tool or env vars), guide the user through the setup steps above before attempting the upload.
