// Main font configuration file
import { creato } from "./creato";
import { sfProDisplay, sfProText } from "./sf-pro";
import { switzer } from "./switzer";

// Export all font configurations
export { creato, sfProDisplay, sfProText, switzer };

// FONT CONFIGURATION:
// Uncomment the font you want to use as the default
// export const defaultFont = switzer;
export const defaultFont = sfProDisplay;
// export const defaultFont = sfProText;
// export const defaultFont = creato;

// The default text font (used for body text)
export const defaultTextFont = sfProText;

// Helper function to get all font variables
export function getAllFontVariables() {
  return `${switzer.variable} ${sfProDisplay.variable} ${sfProText.variable} ${creato.variable}`;
}
