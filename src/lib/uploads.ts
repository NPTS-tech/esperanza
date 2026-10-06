import path from "path";

// Where uploaded images live on disk. Local dev defaults to ./uploads (gitignored);
// on NPTS infra set UPLOAD_STORAGE_PATH=/efs/uploads so files persist on EFS.
export function upload_storage_path(): string {
    return process.env.UPLOAD_STORAGE_PATH || "./uploads";
}

// Resolve an object path (e.g. "events/<id>/<file>") to an absolute path, refusing
// anything that escapes the storage root. Returns null on traversal attempts.
export function resolve_upload(object_path: string): string | null {
    const root = path.resolve(upload_storage_path());
    const full = path.resolve(root, object_path);
    if (full !== root && !full.startsWith(root + path.sep)) return null;
    return full;
}

const CONTENT_TYPES: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
};

export function content_type_for(file_path: string): string {
    return CONTENT_TYPES[path.extname(file_path).toLowerCase()] || "application/octet-stream";
}
