import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { get_supabase_admin, supabase_storage_bucket } from "@/lib/supabase_admin";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MIN_IMAGE_WIDTH = 600;
const MIN_IMAGE_HEIGHT = 400;
const MIN_ASPECT_RATIO = 0.7; // allow portrait but reject extremely tall images
const MAX_ASPECT_RATIO = 3.0; // reject extremely wide strips
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

type ImageDimensions = { width: number; height: number };

function read_u16_be(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function read_u24_le(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function get_png_dimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 24) return null;
  const png_signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < png_signature.length; i += 1) {
    if (bytes[i] !== png_signature[i]) return null;
  }
  return {
    width:
      (bytes[16] << 24) |
      (bytes[17] << 16) |
      (bytes[18] << 8) |
      bytes[19],
    height:
      (bytes[20] << 24) |
      (bytes[21] << 16) |
      (bytes[22] << 8) |
      bytes[23],
  };
}

function get_jpeg_dimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    // standalone markers (no segment length)
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }

    if (offset + 3 >= bytes.length) return null;
    const segment_length = read_u16_be(bytes, offset + 2);
    if (segment_length < 2 || offset + 2 + segment_length > bytes.length) {
      return null;
    }

    const is_sof =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;

    if (is_sof) {
      return {
        height: read_u16_be(bytes, offset + 5),
        width: read_u16_be(bytes, offset + 7),
      };
    }

    offset += 2 + segment_length;
  }

  return null;
}

function get_webp_dimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 30) return null;
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff !== "RIFF" || webp !== "WEBP") return null;

  const chunk_type = String.fromCharCode(...bytes.slice(12, 16));

  if (chunk_type === "VP8X") {
    const width = 1 + read_u24_le(bytes, 24);
    const height = 1 + read_u24_le(bytes, 27);
    return { width, height };
  }

  if (chunk_type === "VP8L") {
    if (bytes[20] !== 0x2f) return null;
    const b1 = bytes[21];
    const b2 = bytes[22];
    const b3 = bytes[23];
    const b4 = bytes[24];
    const width = 1 + (b1 | ((b2 & 0x3f) << 8));
    const height = 1 + (((b2 & 0xc0) >> 6) | (b3 << 2) | ((b4 & 0x0f) << 10));
    return { width, height };
  }

  if (chunk_type === "VP8 ") {
    if (bytes.length < 30) return null;
    const width = ((bytes[27] << 8) | bytes[26]) & 0x3fff;
    const height = ((bytes[29] << 8) | bytes[28]) & 0x3fff;
    return { width, height };
  }

  return null;
}

async function get_image_dimensions(file: File): Promise<ImageDimensions | null> {
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (file.type === "image/png") {
    return get_png_dimensions(bytes);
  }

  if (file.type === "image/jpeg" || file.type === "image/jpg") {
    return get_jpeg_dimensions(bytes);
  }

  if (file.type === "image/webp") {
    return get_webp_dimensions(bytes);
  }

  return null;
}

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

    const dimensions = await get_image_dimensions(file);
    if (!dimensions) {
      return NextResponse.json(
        { error: "Could not read image dimensions. Please upload a valid JPG, PNG, or WEBP file." },
        { status: 400 },
      );
    }

    const { width, height } = dimensions;
    const aspect_ratio = width / height;

    if (width < MIN_IMAGE_WIDTH || height < MIN_IMAGE_HEIGHT) {
      return NextResponse.json(
        {
          error: `Image too small. Minimum size is ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}px.`,
        },
        { status: 400 },
      );
    }

    if (aspect_ratio < MIN_ASPECT_RATIO || aspect_ratio > MAX_ASPECT_RATIO) {
      return NextResponse.json(
        {
          error: "Image aspect ratio is not supported. Use a standard landscape, square, or portrait image.",
        },
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
