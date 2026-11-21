export interface PhotorealOptions {
  /** Show the Instant preview / Photoreal render switch. */
  showsSourceSwitch: boolean;
  /** Show the Generate photoreal render button. */
  showsGenerate: boolean;
}

/**
 * What of the photoreal render the Design step offers. Nothing appears for a feature the server
 * cannot provide: a disabled button with an apology reads as broken. A render made earlier stays
 * viewable even if the renderer has since been switched off.
 */
export function photorealOptions(
  isRendererAvailable: boolean,
  hasRender: boolean
): PhotorealOptions {
  return {
    showsSourceSwitch: isRendererAvailable || hasRender,
    showsGenerate: isRendererAvailable,
  };
}
