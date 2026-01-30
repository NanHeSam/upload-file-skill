---
name: sam-upload-s3
description: "[Internal provider] Upload files to AWS S3. Called by sam-upload-file router. Do not invoke directly for generic upload requests."
metadata:
  author: samhe
  version: "1.0.0"
---

# AWS S3 Upload Provider

Internal provider skill for uploading files to AWS S3 using the `aws` CLI.

## Prerequisites

### AWS CLI

Check if the AWS CLI is installed:

```bash
which aws
```

If not found, install it:

```bash
brew install awscli
```

### Environment Variables

Check that `~/.baoyu-skills/.env` contains:

```bash
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
AWS_S3_PUBLIC_URL=https://your-custom-domain.com
```

`AWS_S3_PUBLIC_URL` is optional. If not set, the standard S3 URL pattern will be used:
`https://{bucket}.s3.{region}.amazonaws.com/{key}`

If required variables are missing, inform the user.

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
   source ~/.baoyu-skills/.env && aws s3 cp "/path/to/file" "s3://${AWS_S3_BUCKET}/${KEY}" --region "$AWS_S3_REGION"
   ```

4. **Construct the URL**:
   - If `AWS_S3_PUBLIC_URL` is set: `${AWS_S3_PUBLIC_URL}/${KEY}`
   - Otherwise: `https://${AWS_S3_BUCKET}.s3.${AWS_S3_REGION}.amazonaws.com/${KEY}`

   Return this URL to the user.

## Error Handling

| Error | Solution |
|-------|----------|
| `aws: command not found` | Run `brew install awscli` |
| `AWS_*` env vars missing | Guide user to add them to `~/.baoyu-skills/.env` |
| Access denied | Check IAM credentials have `s3:PutObject` permission |
| Bucket not found | Verify `AWS_S3_BUCKET` matches an existing bucket |
| File not found | Verify the file path exists |
