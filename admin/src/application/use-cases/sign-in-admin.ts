import type { AuthGateway, SignedInAdmin } from '../ports';
import { err, ok, type Result } from '@/domain/shared/result';

export type SignInError = 'invalid-credentials' | 'not-an-admin' | 'unavailable';


export async function signInAdmin(
  gateway: AuthGateway,
  email: string,
  password: string,
): Promise<Result<SignedInAdmin, SignInError>> {
  let signedIn: SignedInAdmin;

  try {
    signedIn = await gateway.signIn(email, password);
  } catch (cause) {
    return err(isCredentialProblem(cause) ? 'invalid-credentials' : 'unavailable');
  }

  return signedIn.role === 'ADMIN' ? ok(signedIn) : err('not-an-admin');
}

const CREDENTIAL_STATUSES = new Set([401, 409]);

function isCredentialProblem(cause: unknown): boolean {
  return (
    typeof cause === 'object' &&
    cause !== null &&
    'status' in cause &&
    CREDENTIAL_STATUSES.has((cause as { status: number }).status)
  );
}
