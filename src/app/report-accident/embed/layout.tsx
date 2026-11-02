
// This is a minimal layout specifically for the embeddable page.
// It does not include the main AppHeader or AppFooter.
export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The html and body tags are automatically handled by Next.js's root layout.
    // We just need to render the children directly.
    <div className="bg-background text-foreground">
      {children}
    </div>
  );
}
