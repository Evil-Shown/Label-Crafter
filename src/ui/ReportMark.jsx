/**
 * Report Designer mark: a report page with a table and a small chart.
 * Same stroke language as the label mark so both sit on the launcher tiles.
 */
export default function ReportMark({ size = 32, className = '', title = 'Report Designer' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M16 8.5h22.5L50 20v35.5H16V8.5Z"
        stroke="var(--nav)"
        strokeWidth="2.6"
      />
      <path d="M38.5 8.5V20H50" stroke="var(--nav)" strokeWidth="2.6" />
      <path d="M22 28.5h20" stroke="var(--pri)" strokeWidth="2.4" />
      <path d="M22 34.5h14" stroke="var(--pri)" strokeWidth="2.2" />
      <path d="M22 40.5h16" stroke="var(--pri)" strokeWidth="2.2" />
      <path d="M22 46.5h11" stroke="var(--pri)" strokeWidth="2.2" />
      <path d="M40 48.5v-8" stroke="var(--nav)" strokeWidth="2.4" />
      <path d="M44.5 48.5v-12" stroke="var(--nav)" strokeWidth="2.4" />
      <path d="M49 48.5V32" stroke="var(--pri)" strokeWidth="2.4" />
    </svg>
  )
}
