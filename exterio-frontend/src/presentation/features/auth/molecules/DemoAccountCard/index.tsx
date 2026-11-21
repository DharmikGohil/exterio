import { Alert } from '@/presentation/shared/atoms/Alert';
import { Button } from '@/presentation/shared/atoms/Button';
import type { DemoAccount } from '@/domain/models/auth';

export interface DemoAccountCardProps {
  account: DemoAccount;
  onSignIn: () => void;
  isSigningIn: boolean;
  errorMessage?: string | null;
}

/** The published reviewer sign-in: the email and password in full, and one button to use them. */
export function DemoAccountCard({
  account,
  onSignIn,
  isSigningIn,
  errorMessage,
}: DemoAccountCardProps) {
  return (
    <section
      aria-labelledby="demo-account-title"
      className="space-y-4 rounded-xl border border-stone-200 bg-stone-50 p-4"
    >
      <div className="space-y-1">
        <h3 id="demo-account-title" className="text-[15px] font-medium text-stone-900">
          Demo account
        </h3>
        <p className="text-sm text-stone-600">
          Already set up with a sample house, so every step can be tried straight away.
        </p>
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-stone-500">Email</dt>
        <dd className="truncate font-mono text-stone-900">{account.email}</dd>
        <dt className="text-stone-500">Password</dt>
        <dd className="truncate font-mono text-stone-900">{account.password}</dd>
      </dl>
      <Button size="lg" fullWidth isLoading={isSigningIn} onClick={onSignIn}>
        Sign in with the demo account
      </Button>
      {errorMessage && <Alert tone="error">{errorMessage}</Alert>}
    </section>
  );
}
