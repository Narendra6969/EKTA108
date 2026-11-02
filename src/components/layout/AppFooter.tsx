
export default function AppFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} EKTA108. All rights reserved.</p>
        <p className="mt-1">Your partner in emergency response.</p>
      </div>
    </footer>
  );
}
