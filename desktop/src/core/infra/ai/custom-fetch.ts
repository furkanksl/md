import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

const MAX_BODY_BYTES = 5 * 1024 * 1024;

export const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  console.log(`[CustomFetch] ${init?.method || 'GET'} ${input.toString()}`);
  try {
    // @ts-ignore
    const response = await tauriFetch(input, init);
    console.log(`[CustomFetch] Response: ${response.status} ${response.statusText}`);

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
