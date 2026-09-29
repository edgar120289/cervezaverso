export default function BottleFallback({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 160"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M42 4h16v20c0 4 4 6 6 10s4 10 4 16v96a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8V50c0-6 2-12 4-16s6-6 6-10V4Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        d="M42 4h16v20c0 4 4 6 6 10s4 10 4 16v96a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8V50c0-6 2-12 4-16s6-6 6-10V4Z"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <rect x="34" y="70" width="32" height="40" rx="4" fill="currentColor" fillOpacity="0.12" />
    </svg>
  );
}
