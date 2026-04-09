import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function normalizeBucketName(value?: string | null): string {
  const raw = (value ?? "").trim();
  if (!raw) return "chat-attachments";
  return raw.replace(/^['"]+|['"]+$/g, "");
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Supabase server configuration is missing" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const filePath = formData.get("filePath");
    const bucketInput = formData.get("bucket");
    const bucket =
      typeof bucketInput === "string" && bucketInput.trim()
        ? normalizeBucketName(bucketInput)
        : normalizeBucketName(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (typeof filePath !== "string" || !filePath.trim()) {
      return NextResponse.json({ error: "filePath is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const uploadPath = filePath.trim();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uploadPath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (error) {
      if ((error.message || "").toLowerCase().includes("bucket not found")) {
        const { data: bucketsData } = await supabase.storage.listBuckets();
        const availableBuckets =
          bucketsData?.map((item) => item.name).filter(Boolean) ?? [];
        const availableText = availableBuckets.length
          ? ` Available buckets: ${availableBuckets.join(", ")}`
          : "";
        return NextResponse.json(
          {
            error: `Storage bucket "${bucket}" not found.${availableText}`,
            availableBuckets,
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: error.message || "Failed to upload file" },
        { status: 400 }
      );
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uploadPath);
    const { data: signedData } = await supabase.storage
      .from(bucket)
      .createSignedUrl(uploadPath, 60 * 60 * 24 * 7);
    const resolvedUrl = signedData?.signedUrl || urlData.publicUrl;

    return NextResponse.json({
      path: data.path,
      publicUrl: resolvedUrl,
      bucket,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected upload error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
