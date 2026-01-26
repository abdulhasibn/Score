import { AuthService } from "./application/AuthService";
import { SupabaseAuthRepository } from "./infrastructure/SupabaseAuthRepository";
import { SupabaseAuthStateObserver } from "./infrastructure/SupabaseAuthStateObserver";

const authRepository = new SupabaseAuthRepository();
export const authService = new AuthService(authRepository);

const authStateObserver = new SupabaseAuthStateObserver();
export { authStateObserver };
