/* global __BUILD__ */
/** Small build number so Markus can tell which deploy he is looking at. */
export default function BuildTag({ className = '' }) {
  return <span className={`text-[11px] text-muted/70 tabular-nums ${className}`}>Build {__BUILD__}</span>
}
