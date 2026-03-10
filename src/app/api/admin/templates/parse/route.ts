import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processTemplateUpload } from "@/lib/template-parser";

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!   
  );

  const { templateId, version } = await req.json();

  const { data: tmpl } = await supabase
    .from("templates")
    .select("jsx_file_path")
    .eq("id", templateId)
    .single();

  if (!tmpl?.jsx_file_path) {
    return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
  }

  const { data: fileData } = await supabase.storage
    .from("templates-source")
    .download(tmpl.jsx_file_path);

  const jsxCode = await fileData!.text();

  const result = await processTemplateUpload({
    jsxCode,
    templateId,
    version,
    supabase,
  });

  return NextResponse.json(result);
}