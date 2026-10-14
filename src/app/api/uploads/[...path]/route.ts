import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { resolve_upload, content_type_for } from "@/lib/uploads";

type RouteContext = { params: Promise<{ path: string[] }> };

// GET /api/uploads/<objectPath> — stream an uploaded image from disk (UPLOAD_STORAGE_PATH,
// i.e. a local dir in dev or /efs/uploads on NPTS infra). Public: event images are not secret.
export async function GET(_request: Request, { params }: RouteContext) {
    const { path: segments } = await params;
    const object_path = segments.join("/");

    const full = resolve_upload(object_path);
    if (!full) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    try {
        const data = await fs.readFile(full);
        return new NextResponse(new Uint8Array(data), {
            headers: {
                "Content-Type": content_type_for(full),
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
}
