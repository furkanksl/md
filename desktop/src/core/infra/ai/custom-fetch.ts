import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  console.log(`[CustomFetch] ${init?.method || 'GET'} ${input.toString()}`);
  try {
    // @ts-ignore
    const response = await tauriFetch(input, init);
    console.log(`[CustomFetch] Response: ${response.status} ${response.statusText}`);

    // Buffer the response body to avoid streaming issues with tauri-plugin-http
    // and ensure compatibility with AI SDK which might expect standard Response behavior
    const bodyText = await response.text();
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
