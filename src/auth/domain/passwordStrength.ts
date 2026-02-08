/**
 * Password Strength Domain Logic
 *
 * Pure domain logic for calculating password strength.
 * This module is completely independent of UI concerns.
 */

type PasswordStrengthLevel = "very-weak" | "weak" | "good" | "strong";

export interface PasswordStrength {
  score: number;
  level: PasswordStrengthLevel;
  label: string;
}

/**
 * Calculates password strength based on security criteria.
 *
 * Scoring rules:
 * - Min length (8+ chars): 1 point
 * - Uppercase letter: 1 point
 * - Lowercase letter: 1 point
 * - Number: 1 point
 * - Special character: 1 point
 *
 * Total score determines strength level:
 * - 0-1: Very Weak
 * - 2: Weak
 * - 3-4: Good
 * - 5: Strong
 *
 * @param password - The password to evaluate
 * @returns PasswordStrength object with score, level, and label
 */
export function calculatePasswordStrength(
  password: string
): PasswordStrength {
  if (!password) {
    return { score: 0, level: "very-weak", label: "Very Weak" };
  }

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const score =
    (hasMinLength ? 1 : 0) +
    (hasUppercase ? 1 : 0) +
    (hasLowercase ? 1 : 0) +
    (hasNumber ? 1 : 0) +
    (hasSpecialChar ? 1 : 0);

  if (score <= 1) {
    return { score, level: "very-weak", label: "Very Weak" };
  } else if (score === 2) {
    return { score, level: "weak", label: "Weak" };
  } else if (score === 3 || score === 4) {
    return { score, level: "good", label: "Good" };
  } else {
    return { score, level: "strong", label: "Strong" };
  }
}

/**
 * Converts password strength level to the number of active strength bars.
 *
 * @param level - The password strength level
 * @returns Number of bars to display (1-4)
 */
export function getStrengthBarsCount(level: PasswordStrengthLevel): number {
  switch (level) {
    case "very-weak":
      return 1;
    case "weak":
      return 2;
    case "good":
      return 3;
    case "strong":
      return 4;
  }
}
