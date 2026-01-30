#!/usr/bin/env bun
/**
 * sam-upload-file: Upload files to Cloudflare R2 (S3-compatible storage)
 *
 * Usage:
 *   bun main.ts --file /path/to/file.png [options]
 *
 * Options:
 *   --file <path>    Local file path (required)
 *   --key <name>     Custom object key (default: auto-generated)
 *   --bucket <name>  Override bucket name
 *   --json           Output as JSON
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { parseArgs } from "util";
import { readFileSync, statSync, existsSync } from "fs";
import { basename, extname } from "path";
import { config } from "dotenv";

// Load environment variables from ~/.baoyu-skills/.env
const envPath = `${process.env.HOME}/.baoyu-skills/.env`;
if (existsSync(envPath)) {
  config({ path: envPath });
}

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
  // Images
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".bmp": "image/bmp",
  ".tiff": "image/tiff",
  ".tif": "image/tiff",
  // Videos
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  // Audio
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".m4a": "audio/mp4",
  // Documents
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Text
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".xml": "application/xml",
  // Archives
  ".zip": "application/zip",
  ".tar": "application/x-tar",
  ".gz": "application/gzip",
  ".rar": "application/vnd.rar",
  ".7z": "application/x-7z-compressed",
};

function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

function generateKey(filePath: string): string {
  const name = basename(filePath);
  const ext = extname(name);
  const base = basename(name, ext);
  const timestamp = Date.now();
  return `uploads/${base}-${timestamp}${ext}`;
}

interface UploadResult {
  url: string;
  key: string;
  bucket: string;
  size: number;
}

async function uploadFile(
  filePath: string,
  customKey?: string,
  customBucket?: string
): Promise<UploadResult> {
  // Validate environment variables
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = customBucket || process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accessKeyId) throw new Error("R2_ACCESS_KEY_ID not set");
  if (!secretAccessKey) throw new Error("R2_SECRET_ACCESS_KEY not set");
  if (!endpoint) throw new Error("R2_ENDPOINT not set");
  if (!bucket) throw new Error("R2_BUCKET not set (use --bucket or set R2_BUCKET)");
  if (!publicUrl) throw new Error("R2_PUBLIC_URL not set");

  // Validate file exists
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const stats = statSync(filePath);
  if (!stats.isFile()) {
    throw new Error(`Not a file: ${filePath}`);
  }

  // Create S3 client for R2
  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  // Read file and determine content type
  const fileContent = readFileSync(filePath);
  const contentType = getMimeType(filePath);
  const key = customKey || generateKey(filePath);

  // Upload file
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
  });

  await client.send(command);

  // Construct public URL
  const url = `${publicUrl.replace(/\/$/, "")}/${key}`;

  return {
    url,
    key,
    bucket,
    size: stats.size,
  };
}

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      file: { type: "string" },
      key: { type: "string" },
      bucket: { type: "string" },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });

  if (values.help) {
    console.log(`
sam-upload-file: Upload files to Cloudflare R2

Usage:
  bun main.ts --file /path/to/file.png [options]

Options:
  --file <path>    Local file path (required)
  --key <name>     Custom object key (default: auto-generated)
  --bucket <name>  Override bucket name
  --json           Output as JSON
  --help           Show this help message

Environment Variables (in ~/.baoyu-skills/.env):
  R2_ACCESS_KEY_ID      Your R2 access key ID
  R2_SECRET_ACCESS_KEY  Your R2 secret access key
  R2_ENDPOINT           R2 endpoint URL
  R2_BUCKET             Default bucket name
  R2_PUBLIC_URL         Public URL prefix for uploaded files
`);
    process.exit(0);
  }

  if (!values.file) {
    console.error("Error: --file is required");
    process.exit(1);
  }

  try {
    const result = await uploadFile(values.file, values.key, values.bucket);

    if (values.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(result.url);
    }
  } catch (error) {
    if (values.json) {
      console.log(JSON.stringify({ error: (error as Error).message }));
    } else {
      console.error(`Error: ${(error as Error).message}`);
    }
    process.exit(1);
  }
}

main();
