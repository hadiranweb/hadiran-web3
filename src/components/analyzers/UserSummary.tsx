export function UserSummaryView({ text }: { text: string }) {
  return (
    <section className="surface p-6 sm:p-8">
      <p className="whitespace-pre-wrap text-base leading-8 text-ink">{text}</p>
    </section>
  );
}
