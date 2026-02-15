"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

type PasswordStrength = {
  score: number;
  label: string;
  color: string;
  suggestions: string[];
};

function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const suggestions: string[] = [];

  if (!password) {
    return {
      score: 0,
      label: "No password",
      color: "bg-zinc-200 dark:bg-zinc-800",
      suggestions: [],
    };
  }

  // Length check
  if (password.length >= 8) score += 1;
  else suggestions.push("Use at least 8 characters");

  if (password.length >= 12) score += 1;
  else if (password.length >= 8) suggestions.push("Consider using 12+ characters");

  // Uppercase check
  if (/[A-Z]/.test(password)) score += 1;
  else suggestions.push("Add uppercase letters (A-Z)");

  // Lowercase check
  if (/[a-z]/.test(password)) score += 1;
  else suggestions.push("Add lowercase letters (a-z)");

  // Number check
  if (/[0-9]/.test(password)) score += 1;
  else suggestions.push("Add numbers (0-9)");

  // Special character check
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else suggestions.push("Add special characters (!@#$%^&*)");

  // Determine strength level
  let label = "Very Weak";
  let color = "bg-red-500";

  if (score >= 6) {
    label = "Strong";
    color = "bg-green-500";
  } else if (score >= 4) {
    label = "Good";
    color = "bg-yellow-500";
  } else if (score >= 2) {
    label = "Weak";
    color = "bg-orange-500";
  }

  return { score, label, color, suggestions };
}

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  if (!password) return null;

  const widthPercentage = (strength.score / 6) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Password Strength
        </span>
        <span
          className={cn(
            "text-xs font-semibold",
            strength.score >= 6 && "text-green-600 dark:text-green-400",
            strength.score >= 4 && strength.score < 6 && "text-yellow-600 dark:text-yellow-400",
            strength.score >= 2 && strength.score < 4 && "text-orange-600 dark:text-orange-400",
            strength.score < 2 && "text-red-600 dark:text-red-400"
          )}
        >
          {strength.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={cn("h-full transition-all duration-300", strength.color)}
          style={{ width: `${widthPercentage}%` }}
        />
      </div>

      {/* Suggestions */}
      {strength.suggestions.length > 0 && (
        <ul className="space-y-1">
          {strength.suggestions.slice(0, 3).map((suggestion, index) => (
            <li
              key={index}
              className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start"
            >
              <span className="mr-1">•</span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
