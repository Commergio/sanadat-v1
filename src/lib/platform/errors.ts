export class PlatformResolutionError extends Error {
  constructor(
    message: string,
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN"
  ) {
    super(message);
    this.name = "PlatformResolutionError";
  }
}
