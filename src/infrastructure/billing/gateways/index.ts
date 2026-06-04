import type { BillingGateway } from "@/application/billing";
import { ManualCheckoutGateway } from "./manual.adapter";
import type { CheckoutGatewayPort } from "./types";

const manualAdapter = new ManualCheckoutGateway();

/**
 * P2.2: all gateways route to the manual adapter until real integrations ship.
 */
export function getCheckoutGateway(_gateway: BillingGateway): CheckoutGatewayPort {
  return manualAdapter;
}

export type { CheckoutGatewayPort, CreateCheckoutSessionInput, CheckoutSessionResult } from "./types";
