export interface User {
  id: string;
  email: string | null;
  name: string;
  isGuest: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

/** The shared reviewer sign-in a deployment publishes on its sign-in page. */
export interface DemoAccount {
  email: string;
  password: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  name: string;
}

/** What the create-account form collects: the API fields plus the password typed a second time. */
export interface RegisterFormParams extends RegisterParams {
  confirmPassword: string;
}
