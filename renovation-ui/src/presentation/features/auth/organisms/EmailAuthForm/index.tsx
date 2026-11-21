import { Alert } from '@/presentation/shared/atoms/Alert';
import { Button } from '@/presentation/shared/atoms/Button';
import { Input } from '@/presentation/shared/atoms/Input';
import { Tabs, type TabItem } from '@/presentation/shared/atoms/Tabs';
import { FormField } from '@/presentation/shared/molecules/FormField';
import { PasswordInput } from '@/presentation/shared/molecules/PasswordInput';
import { useAuthForm, type AuthMode } from '@/presentation/features/auth/hooks/useAuthForm';

const MODE_TABS: TabItem<AuthMode>[] = [
  { value: 'login', label: 'Sign in' },
  { value: 'register', label: 'Create account' },
];

/** Email + password sign in / registration. */
export function EmailAuthForm() {
  const form = useAuthForm();
  const isRegister = form.mode === 'register';

  return (
    <div className="space-y-5">
      <Tabs
        items={MODE_TABS}
        value={form.mode}
        onValueChange={form.changeMode}
        variant="pill"
        label="Sign in or create an account"
        fullWidth
      />
      <form className="space-y-4" onSubmit={form.handleSubmit} noValidate>
        {isRegister && (
          <FormField label="Your name" htmlFor="auth-name">
            <Input
              id="auth-name"
              autoComplete="name"
              placeholder="Asha Patel"
              value={form.name}
              onChange={(event) => form.setName(event.target.value)}
            />
          </FormField>
        )}
        <FormField label="Email" htmlFor="auth-email">
          <Input
            id="auth-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(event) => form.setEmail(event.target.value)}
          />
        </FormField>
        <FormField
          label="Password"
          htmlFor="auth-password"
          hint={isRegister ? 'At least 8 characters.' : undefined}
        >
          <PasswordInput
            id="auth-password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={form.password}
            onChange={(event) => form.setPassword(event.target.value)}
          />
        </FormField>
        {isRegister && (
          <FormField
            label="Confirm password"
            htmlFor="auth-confirm-password"
            error={form.passwordsDiffer ? 'The two passwords do not match.' : null}
          >
            <PasswordInput
              id="auth-confirm-password"
              autoComplete="new-password"
              invalid={form.passwordsDiffer}
              value={form.confirmPassword}
              onChange={(event) => form.setConfirmPassword(event.target.value)}
            />
          </FormField>
        )}
        {form.errorMessage && <Alert tone="error">{form.errorMessage}</Alert>}
        <Button type="submit" variant="outline" fullWidth isLoading={form.isSubmitting}>
          {isRegister ? 'Create account' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
