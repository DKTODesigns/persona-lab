import type { SVGProps } from "react";

export function InfoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0ZM9 9a1 1 0 0 1 2 0v4a1 1 0 1 1-2 0V9Zm1-4a1.25 1.25 0 1 1 0 2.5A1.25 1.25 0 0 1 10 5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function AlertIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M8.485 3.495c.673-1.165 2.357-1.165 3.03 0l6.28 10.875c.673 1.167-.169 2.63-1.516 2.63H3.72c-1.347 0-2.189-1.463-1.515-2.63L8.485 3.495ZM10 7a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0V8a1 1 0 0 1 1-1Zm0 7a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function SpinnerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
    </svg>
  );
}

export function EvidenceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 0 1 0 1.415l-7.25 7.25a1 1 0 0 1-1.415 0l-3.25-3.25a1 1 0 1 1 1.415-1.414l2.542 2.542 6.543-6.543a1 1 0 0 1 1.415 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function InferenceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 10h11m0 0-4-4m4 4-4 4" />
    </svg>
  );
}

export function AssumptionIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.5 12c1.5-3 3.5-3 5 0s3.5 3 5 0 3.5-3 5 0" />
    </svg>
  );
}

export function UnknownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <circle cx="10" cy="10" r="7.25" strokeDasharray="2.2 2.4" />
      <path
        d="M7.75 8a2.25 2.25 0 1 1 3.4 1.94c-.66.4-1.15.86-1.15 1.66"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="14.25" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="9" r="6" />
      <path d="m17 17-3.5-3.5" />
    </svg>
  );
}

export function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 8a5 5 0 0 0-10 0c0 4.5-2 5.5-2 5.5h14s-2-1-2-5.5Z" />
      <path d="M8.2 16a1.8 1.8 0 0 0 3.6 0" />
    </svg>
  );
}

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" {...props}>
      <path d="M3 6h14M3 10h14M3 14h14" />
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" {...props}>
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
    </svg>
  );
}

export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4.5" y="9" width="11" height="7.5" rx="1.5" />
      <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
    </svg>
  );
}

export function LightbulbIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 15h6M8 17.5h4" />
      <path d="M10 2.5a5.5 5.5 0 0 0-3 10.1c.5.4.8 1 .8 1.6v.3h4.4v-.3c0-.6.3-1.2.8-1.6A5.5 5.5 0 0 0 10 2.5Z" />
    </svg>
  );
}

// Section-heading icons for the persona detail panel (Goals, Frustrations,
// Behaviors, Context of Use, Accessibility Considerations) — decorative only,
// always rendered with aria-hidden by the caller.

export function TargetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <circle cx="10" cy="10" r="7.25" />
      <circle cx="10" cy="10" r="4.25" />
      <circle cx="10" cy="10" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TriangleAlertIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 3.2 17.5 16H2.5L10 3.2Z" />
      <path d="M10 8.25v3.25" />
      <circle cx="10" cy="13.75" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function RepeatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 8V6.5A2.5 2.5 0 0 1 7.5 4H14" />
      <path d="M11.5 1.5 14 4l-2.5 2.5" />
      <path d="M15 12v1.5a2.5 2.5 0 0 1-2.5 2.5H6" />
      <path d="M8.5 18.5 6 16l2.5-2.5" />
    </svg>
  );
}

export function MapPinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 18s6-5.5 6-10a6 6 0 1 0-12 0c0 4.5 6 10 6 10Z" />
      <circle cx="10" cy="8" r="2" />
    </svg>
  );
}

export function AccessibilityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <circle cx="10" cy="10" r="8" />
      <circle cx="10" cy="6" r="1.1" fill="currentColor" stroke="none" />
      <path d="M6.5 8.5h7" strokeLinecap="round" />
      <path d="M10 8.5v3l2.5 3.5M10 11.5 7.5 15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
