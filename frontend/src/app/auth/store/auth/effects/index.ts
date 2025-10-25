export * from './login.effects';
export * from './signup.effects';
export * from './token.effects';
export * from './google.effects';
export * from './user.effects';
export * from './password.effects';
export * from './email.effects';
export * from './session.effects';

// Grouped array for convenient registration
import { LoginEffects } from './login.effects';
import { SignupEffects } from './signup.effects';
import { TokenEffects } from './token.effects';
import { GoogleEffects } from './google.effects';
import { UserEffects } from './user.effects';
import { PasswordEffects } from './password.effects';
import { EmailEffects } from './email.effects';
import { SessionEffects } from './session.effects';

export const AUTH_EFFECTS = [
  LoginEffects,
  SignupEffects,
  TokenEffects,
  GoogleEffects,
  UserEffects,
  PasswordEffects,
  EmailEffects,
  SessionEffects,
];