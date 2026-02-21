import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

const MAX_BODY_BYTES = 5 * 1024 * 1024;

const getHeader = (headers: RequestInit["headers"], key: string): string | null => {
  if (!headers) return null;
  if (headers instanceof Headers) return headers.get(key);
  if (Array.isArray(headers)) {
    const found = headers.find(([k]) => k.toLowerCase() === key.toLowerCase());
    return found ? String(found[1]) : null;
  }
  const record = headers as Record<string, string>;
  const matchKey = Object.keys(record).find((k) => k.toLowerCase() === key.toLowerCase());
  return matchKey ? (record[matchKey] ?? null) : null;
};

export const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  console.log(`[CustomFetch] ${init?.method || 'GET'} ${input.toString()}`);
  try {
    // @ts-ignore
    const response = await tauriFetch(input, init);
    console.log(`[CustomFetch] Response: ${response.status} ${response.statusText}`);

    const accept = getHeader(init?.headers, "accept");
    const contentType = response.headers.get("content-type");
    const wantsStream = (accept && accept.includes("text/event-stream")) || (contentType && contentType.includes("text/event-stream"));

    // If streaming is requested and the response is stream-capable, return as-is
    // so the AI SDK can consume tokens incrementally.
    // @ts-ignore - tauriFetch Response is compatible enough for AI SDK streaming.
    if (wantsStream && response.body) {
      return response;
    }

    // Buffer the response body to avoid streaming issues with tauri-plugin-http
    // and ensure compatibility with AI SDK which might expect standard Response behavior
    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
      throw new Error(`[CustomFetch] Response too large: ${contentLength} bytes`);
    }

    let bodyText = await response.text();
    if (bodyText.length > MAX_BODY_BYTES) {
      console.warn(`[CustomFetch] Body truncated to ${MAX_BODY_BYTES} chars`);
      bodyText = bodyText.slice(0, MAX_BODY_BYTES);
    }

    console.log(`[CustomFetch] Body sample:`, bodyText.slice(0, 200));

    return new Response(bodyText, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (e) {
    console.error(`[CustomFetch] Error:`, e);
    throw e;
  }
};
