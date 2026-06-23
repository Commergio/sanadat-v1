/**
 * Server startup hook — logs Moyasar configuration errors early when keys are present.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { getMoyasarPublicKey, getMoyasarSecretKey, validateMoyasarPaymentsEnv } =
    await import("@/lib/env");

  if (!getMoyasarSecretKey() && !getMoyasarPublicKey()) return;

  const result = validateMoyasarPaymentsEnv();
  if (!result.ok) {
    console.error(`[Sanadat] Moyasar configuration error: ${result.message}`);
  }
}
