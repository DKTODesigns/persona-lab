// Shared focus-visible treatment for non-<button> interactive elements
// (native <summary> disclosures, in-page anchor links) so keyboard focus
// stays visible and consistent without doubling up on the browser's
// default focus ring.
export const FOCUS_RING_CLASSES =
  "outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
