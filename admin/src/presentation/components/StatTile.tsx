export type Tone = 'neutral' | 'good' | 'loss';

interface StatTileProps {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
  readonly tone?: Tone;
}

export function StatTile({ label, value, hint, tone = 'neutral' }: StatTileProps) {
  return (
    <div className="tile">
      <span className="tile-label">{label}</span>
      <span className="tile-value" data-tone={tone}>
        {value}
      </span>
      {hint && <span className="tile-hint">{hint}</span>}
    </div>
  );
}

export function StatGrid({ children }: { readonly children: React.ReactNode }) {
  return <div className="tiles">{children}</div>;
}
