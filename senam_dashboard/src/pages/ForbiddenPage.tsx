import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-semibold">403</h1>
      <p className="text-muted-foreground">You don&apos;t have access to this page.</p>
      <Link to="/" className="text-primary underline">
        Go home
      </Link>
    </div>
  );
}
