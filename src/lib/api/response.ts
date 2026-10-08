import { NextResponse } from "next/server";

export type ApiSuccess<T extends Record<string, unknown> = Record<string, unknown>> = {
  success: true;
  message?: string;
} & T;

export type ApiError = {
  success: false;
  message: string;
  error?: string;
  code?: string;
  fields?: Record<string, string>;
};

export function jsonOk<T extends Record<string, unknown>>(
  data: T,
  init?: { status?: number; message?: string }
) {
  return NextResponse.json(
    {
      success: true,
      ...(init?.message ? { message: init.message } : {}),
      ...data,
    } satisfies ApiSuccess<T>,
    { status: init?.status ?? 200, headers: { "Content-Type": "application/json" } }
  );
}

export function jsonError(
  message: string,
  init?: { status?: number; error?: string; code?: string; fields?: Record<string, string> }
) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(init?.error ? { error: init.error } : {}),
      ...(init?.code ? { code: init.code } : {}),
      ...(init?.fields ? { fields: init.fields } : {}),
    } satisfies ApiError,
    { status: init?.status ?? 500, headers: { "Content-Type": "application/json" } }
  );
}

/** Parse fetch Response — never throws on non-JSON bodies. */
export async function parseApiResponse<T = Record<string, unknown>>(res: Response): Promise<{
  ok: boolean;
  status: number;
  data: T | null;
  errorMessage: string;
  isJson: boolean;
}> {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const text = await res.text();

  if (!text) {
    return {
      ok: res.ok,
      status: res.status,
      data: null,
      isJson,
      errorMessage: res.ok
        ? "Empty response from server."
        : `Server error (${res.status}). No response body was returned.`,
    };
  }

  if (!isJson) {
    const preview = text.replace(/\s+/g, " ").trim().slice(0, 120);
    return {
      ok: false,
      status: res.status,
      data: null,
      isJson: false,
      errorMessage:
        res.status === 413
          ? "The uploaded file is too large for the server to accept."
          : res.status === 504 || res.status === 502
            ? "The import timed out. Try a smaller file or split the export into batches."
            : preview.startsWith("<!DOCTYPE") || preview.startsWith("<html")
              ? "The server returned an HTML error page instead of JSON. Check that you are signed in and try again."
              : `Unexpected server response: ${preview}`,
    };
  }

  try {
    const data = JSON.parse(text) as T;
    const body = data as Record<string, unknown>;
    const message =
      (typeof body.message === "string" && body.message) ||
      (typeof body.error === "string" && body.error) ||
      (!res.ok ? `Request failed (${res.status}).` : "");

    return {
      ok: res.ok && body.success !== false,
      status: res.status,
      data,
      isJson: true,
      errorMessage: message,
    };
  } catch {
    return {
      ok: false,
      status: res.status,
      data: null,
      isJson: false,
      errorMessage: `Invalid JSON response from server (${res.status}).`,
    };
  }
}
