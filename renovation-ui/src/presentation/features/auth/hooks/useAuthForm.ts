import { useState, type FormEvent } from 'react';

import { getErrorMessage } from '@/presentation/shared/utils/errors';

import { useAuthActions } from './useAuthActions';

export type AuthMode = 'login' | 'register';

/** Form state for the email + password panel (sign in / create account). */
export function useAuthForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const {
    login,
    isLoggingIn,
    loginError,
    resetLoginState,
    register,
    isRegistering,
    registerError,
    resetRegisterState,
  } = useAuthActions();

  const changeMode = (next: AuthMode) => {
    setMode(next);
    resetLoginState();
    resetRegisterState();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === 'login') {
      login({ email, password });
    } else {
      register({ name, email, password, confirmPassword });
    }
  };

  const activeError = mode === 'login' ? loginError : registerError;
  // Said as soon as the second password is complete, not only on submit.
  const passwordsDiffer =
    mode === 'register' && confirmPassword.length > 0 && confirmPassword !== password;

  return {
    mode,
    changeMode,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordsDiffer,
    handleSubmit,
    isSubmitting: isLoggingIn || isRegistering,
    errorMessage: activeError ? getErrorMessage(activeError) : null,
  };
}
