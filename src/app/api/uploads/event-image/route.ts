import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { get_supabase_admin, supabase_storage_bucket } from "@/lib/supabase_admin";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

function extension_from_mime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

export async function POST(request: Request) {
  try {
    let supabase_admin;
    try {
      supabase_admin = get_supabase_admin();
    } catch (e) {
      return NextResponse.json(
        {
          error:
            e instanceof Error
              ? e.message
              : "Supabase storage is not configured",
        },
        { status: 500 },
      );
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "PROVIDER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const form_data = await request.formData();
    const file = form_data.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Allowed types: JPG, PNG, WEBP.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Max size is 5MB." },
        { status: 400 },
      );
    }

    const ext = extension_from_mime(file.type);
    const file_name = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const object_path = `${session.user.id}/${file_name}`;

    const { error: upload_error } = await supabase_admin.storage
      .from(supabase_storage_bucket)
      .upload(object_path, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (upload_error) {
      console.error("Supabase upload error:", upload_error);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 },
      );
    }

    const { data } = supabase_admin.storage
      .from(supabase_storage_bucket)
      .getPublicUrl(object_path);

    return NextResponse.json({
      url: data.publicUrl,
      path: object_path,
    });
  } catch (error) {
    console.error("POST /api/uploads/event-image error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
