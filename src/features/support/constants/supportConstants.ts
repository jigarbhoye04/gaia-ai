export const SUPPORT_REQUEST_TYPES = {
  SUPPORT: "support",
  FEATURE: "feature",
} as const;

export const SUPPORT_REQUEST_TYPE_LABELS = {
  [SUPPORT_REQUEST_TYPES.SUPPORT]: "Support Request",
  [SUPPORT_REQUEST_TYPES.FEATURE]: "Feature Request",
} as const;

export const FORM_VALIDATION = {
  MIN_TITLE_LENGTH: 5,
  MIN_DESCRIPTION_LENGTH: 20,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 2000,
} as const;

export const API_ENDPOINTS = {
  SUBMIT_REQUEST: "/api/support/requests",
  GET_REQUEST_STATUS: "/api/support/requests",
  GET_FAQ: "/api/support/faq",
} as const;

export const TOAST_MESSAGES = {
  SUCCESS: "Thanks for reaching out! We'll get back to you soon.",
  VALIDATION_ERROR: "Please fill in all fields",
  TITLE_TOO_SHORT: `Title must be at least ${FORM_VALIDATION.MIN_TITLE_LENGTH} characters long`,
  DESCRIPTION_TOO_SHORT: `Description must be at least ${FORM_VALIDATION.MIN_DESCRIPTION_LENGTH} characters long`,
  GENERIC_ERROR: "Something went wrong. Please try again.",
} as const;
