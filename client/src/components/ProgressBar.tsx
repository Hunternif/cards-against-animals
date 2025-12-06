interface Props {
  /** Progress value from 0 to 100 */
  value: number;
  className?: string;
}

/**
 * A horizontal progress bar showing completion percentage.
 */
export function ProgressBar({ value, className }: Props) {
  const percent = Math.max(0, Math.min(100, value));
  
  const containerClasses = ['progress-bar'];
  if (className) {
    containerClasses.push(className);
  }

  return (
    <div className={containerClasses.join(' ')}>
      <div
        className="bar"
        style={{
          width: `${percent}%`,
        }}
      />
    </div>
  );
}
