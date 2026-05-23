interface Props {
  value: unknown;
  className?: string;
}

export function JsonView({ value, className }: Props) {
  let text: string;
  try {
    text = JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }
  return (
    <pre
      dir="ltr"
      className={
        'max-h-[60vh] overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs leading-5 ' +
        (className ?? '')
      }
    >
      {text}
    </pre>
  );
}
