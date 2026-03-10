// ============================================================
// template-parser.js
// Dijalankan server-side (Node.js / Supabase Edge Function)
// saat admin upload JSX baru
//
// Flow:
//   1. Receive JSX file buffer
//   2. Parse → extract TEMPLATE_SCHEMA
//   3. Compile JSX → JS bundle (esbuild)
//   4. Upload ke Supabase Storage
//   5. Update row di table templates
// ============================================================

import * as esbuild from "esbuild";
import { createHash } from "crypto";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";

// ============================================================
// STEP 1: VALIDATE FILE
// Cek whitelist import sebelum compile
// ============================================================

const ALLOWED_IMPORTS = new Set([
  "react",
  "framer-motion",
  "date-fns",
  "date-fns/locale",
  "react-countdown",
]);

const REQUIRED_EXPORTS = ["default", "TEMPLATE_SCHEMA"];

export function validateJSX(jsxCode) {
  const errors = [];

  // Parse AST
  let ast;
  try {
    ast = parse(jsxCode, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });
  } catch (e) {
    return { valid: false, errors: [`Syntax error: ${e.message}`] };
  }

  const foundExports = new Set();
  const foundImports = [];

  traverse(ast, {
    // Cek imports
    ImportDeclaration({ node }) {
      const source = node.source.value;
      foundImports.push(source);

      // Cek apakah import diizinkan
      const isAllowed = [...ALLOWED_IMPORTS].some(
        (allowed) => source === allowed || source.startsWith(allowed + "/")
      );
      if (!isAllowed) {
        errors.push(`Import tidak diizinkan: "${source}". Hanya boleh: ${[...ALLOWED_IMPORTS].join(", ")}`);
      }
    },

    // Cek exports
    ExportDefaultDeclaration() {
      foundExports.add("default");
    },
    ExportNamedDeclaration({ node }) {
      if (node.declaration) {
        // export const TEMPLATE_SCHEMA = ...
        if (node.declaration.type === "VariableDeclaration") {
          node.declaration.declarations.forEach((d) => {
            if (d.id?.name) foundExports.add(d.id.name);
          });
        }
      }
    },

    // Blokir API calls berbahaya
    MemberExpression({ node }) {
      const obj = node.object?.name;
      const prop = node.property?.name;
      if (
        (obj === "window" && ["fetch", "XMLHttpRequest", "localStorage", "sessionStorage"].includes(prop)) ||
        (obj === "process") ||
        (obj === "fs")
      ) {
        errors.push(`Penggunaan "${obj}.${prop}" tidak diizinkan`);
      }
    },

    CallExpression({ node }) {
      if (node.callee?.name === "fetch" || node.callee?.name === "require") {
        errors.push(`Penggunaan "${node.callee.name}()" tidak diizinkan`);
      }
    },
  });

  // Cek required exports
  REQUIRED_EXPORTS.forEach((required) => {
    if (!foundExports.has(required)) {
      errors.push(`Wajib export "${required}" tidak ditemukan`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    imports: foundImports,
    exports: [...foundExports],
  };
}

// ============================================================
// STEP 2: EXTRACT TEMPLATE_SCHEMA
// Eval TEMPLATE_SCHEMA dengan sandbox sederhana
// ============================================================

export function extractSchema(jsxCode) {
  // Cari blok TEMPLATE_SCHEMA via regex (safe, tanpa eval)
  // Ambil dari AST value node

  let ast;
  try {
    ast = parse(jsxCode, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });
  } catch (e) {
    throw new Error(`Parse error: ${e.message}`);
  }

  let schemaNode = null;

  traverse(ast, {
    ExportNamedDeclaration({ node }) {
      if (node.declaration?.type === "VariableDeclaration") {
        node.declaration.declarations.forEach((d) => {
          if (d.id?.name === "TEMPLATE_SCHEMA") {
            schemaNode = d.init;
          }
        });
      }
    },
  });

  if (!schemaNode) {
    throw new Error("TEMPLATE_SCHEMA tidak ditemukan");
  }

  // Convert AST node ke plain JS object (safe eval via node serializer)
  // Gunakan @babel/generator untuk dapat string, lalu JSON.parse-friendly eval
  const schema = astNodeToValue(schemaNode);
  return schema;
}

// Helper: convert babel AST node ke JS value (no eval)
function astNodeToValue(node) {
  if (!node) return null;

  switch (node.type) {
    case "ObjectExpression": {
      const obj = {};
      node.properties.forEach((prop) => {
        if (prop.type === "ObjectProperty") {
          const key = prop.key.name || prop.key.value;
          obj[key] = astNodeToValue(prop.value);
        }
      });
      return obj;
    }
    case "ArrayExpression":
      return node.elements.map(astNodeToValue);
    case "StringLiteral":
    case "TemplateLiteral":
      return node.quasis?.[0]?.value?.cooked ?? node.value;
    case "NumericLiteral":
      return node.value;
    case "BooleanLiteral":
      return node.value;
    case "NullLiteral":
      return null;
    case "Identifier":
      if (node.name === "undefined") return undefined;
      if (node.name === "null") return null;
      return node.name; // fallback string
    default:
      return null;
  }
}

// ============================================================
// STEP 3: COMPILE JSX → JS bundle (esbuild)
// ============================================================

export async function compileJSX(jsxCode, templateId) {
  const result = await esbuild.build({
    stdin: {
      contents: jsxCode,
      loader: "jsx",
      sourcefile: `template-${templateId}.jsx`,
    },
    bundle: true,
    format: "esm",
    platform: "browser",
    minify: true,
    external: [
      "react",
      "react-dom",
      "framer-motion",
      "date-fns",
      "date-fns/locale",
      "react-countdown",
    ],
    write: false,
  });

  if (result.errors.length > 0) {
    throw new Error(`Compile error: ${result.errors.map((e) => e.text).join(", ")}`);
  }

  return result.outputFiles[0].text;
}

// ============================================================
// STEP 4: HASH file (untuk deteksi duplikat / perubahan)
// ============================================================

export function hashFile(content) {
  return createHash("sha256").update(content).digest("hex");
}

// ============================================================
// MAIN: processTemplateUpload
// Dipanggil dari API route / Edge Function saat admin upload
// ============================================================

export async function processTemplateUpload({
  jsxCode,          // string: isi file JSX
  templateId,       // uuid: dari row templates yang sudah dibuat
  version,          // integer: versi baru
  supabase,         // Supabase client dengan service_role key
}) {
  const logs = [];

  try {
    // 1. Validate
    const validation = validateJSX(jsxCode);
    if (!validation.valid) {
      throw new Error(`Validasi gagal:\n${validation.errors.join("\n")}`);
    }
    logs.push("✓ Validasi JSX lolos");

    // 2. Extract schema
    const schema = extractSchema(jsxCode);
    logs.push("✓ Schema berhasil di-extract");

    // 3. Compile
    const compiledJS = await compileJSX(jsxCode, templateId);
    logs.push("✓ JSX berhasil dikompilasi");

    // 4. Hash
    const fileHash = hashFile(jsxCode);

    // 5. Upload JSX source ke Storage (private bucket)
    const jsxPath = `${templateId}/v${version}/component.jsx`;
    await supabase.storage
      .from("templates-source")
      .upload(jsxPath, jsxCode, { contentType: "text/plain", upsert: true });

    // 6. Upload compiled JS ke Storage (private bucket)
    const jsPath = `${templateId}/v${version}/compiled.js`;
    await supabase.storage
      .from("templates-source")
      .upload(jsPath, compiledJS, { contentType: "application/javascript", upsert: true });

    logs.push("✓ File diupload ke Storage");

    // 7. Update table templates
    await supabase
      .from("templates")
      .update({
        jsx_file_path: jsxPath,
        compiled_js_path: jsPath,
        content_schema: schema.content_schema,
        guest_schema: schema.guest_schema,
        default_content: schema.default_content,
        current_version: version,
        parse_status: "compiled",
        parse_error: null,
        updated_at: new Date().toISOString(),
        // Update meta dari schema.meta juga
        category: schema.meta?.category ?? "general",
        is_premium: schema.meta?.is_premium ?? false,
        tags: schema.meta?.tags ?? [],
        color_palette: schema.meta?.color_palette ?? [],
      })
      .eq("id", templateId);

    // 8. Simpan ke template_versions
    await supabase.from("template_versions").insert({
      template_id: templateId,
      version,
      jsx_file_path: jsxPath,
      compiled_js_path: jsPath,
      content_schema: schema.content_schema,
      guest_schema: schema.guest_schema,
      default_content: schema.default_content,
    });

    // 9. Log sukses
    await supabase.from("template_parse_logs").insert({
      template_id: templateId,
      version,
      status: "success",
      parsed_schema: schema,
      raw_jsx_hash: fileHash,
    });

    logs.push("✓ Database diupdate");

    return { success: true, schema, logs };

  } catch (error) {
    // Log gagal
    await supabase
      .from("templates")
      .update({ parse_status: "failed", parse_error: error.message })
      .eq("id", templateId);

    await supabase.from("template_parse_logs").insert({
      template_id: templateId,
      version,
      status: "failed",
      error_message: error.message,
    });

    return { success: false, error: error.message, logs };
  }
}