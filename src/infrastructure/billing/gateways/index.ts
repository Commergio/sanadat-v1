import type { BillingGateway } from "@/application/billing";
import { ManualCheckoutGateway } from "./manual.adapter";
import { MoyasarCheckoutGateway } from "./moyasar.adapter";
import type { CheckoutGatewayPort } from "./types";

const manualAdapter = new ManualCheckoutGateway();
const moyasarAdapter = new MoyasarCheckoutGateway();

/**
 * P2.5.1: Moyasar sandbox for `moyasar` gateway.
 * Manual adapter remains for `manual` and unimplemented PSPs.
 */
export function getCheckoutGateway(gateway: BillingGateway): CheckoutGatewayPort {
  if (gateway === "moyasar") return moyasarAdapter;
  return manualAdapter;
}

export type { CheckoutGatewayPort, CreateCheckoutSessionInput, CheckoutSessionResult } from "./types";
