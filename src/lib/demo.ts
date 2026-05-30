/** Small helpers for prototype / demo flows (no real API calls). */

export async function simulateNetworkDelay(ms = 500): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
