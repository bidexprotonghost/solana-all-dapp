const AXIOM_API_ENDPOINT = 'https://api.axiom.xyz/health';
const REQUEST_TIMEOUT_MS = 10000;

export type AxiomHealthStatus = {
  status: string;
  timestamp?: number;
  [key: string]: unknown;
};

export async function getAxiomStatus(): Promise<AxiomHealthStatus> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(AXIOM_API_ENDPOINT, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Axiom API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid Axiom response: expected JSON object');
    }

    return data as AxiomHealthStatus;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Axiom health check request timed out');
    }
    throw new Error(`Axiom health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    clearTimeout(timeoutId);
  }
}
