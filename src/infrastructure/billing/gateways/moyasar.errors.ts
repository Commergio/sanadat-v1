export class MoyasarGatewayError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "MoyasarGatewayError";
  }
}
