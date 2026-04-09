import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function normalizeBucketName(value?: string | null): string {
  const raw = (value ?? "").trim();
  if (!raw) return "chat-attachments";
  return raw.replace(/^['"]+|['"]+$/g, "");
}

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Supabase server configuration is missing" },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const filePath = url.searchParams.get("path")?.trim();
    const download = url.searchParams.get("download") === "1";
    const bucket = normalizeBucketName(
      url.searchParams.get("bucket") || process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET
    );

    if (!filePath) {
      return NextResponse.json({ error: "path is required" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 60 * 60, {
        download,
      });

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: error?.message || "Failed to create signed URL" },
        { status: 400 }
      );
    }

    return NextResponse.json({ url: data.signedUrl, path: filePath, bucket });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected signed URL error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
