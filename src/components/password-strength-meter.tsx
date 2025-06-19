"use client";

import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    label: "Contains uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: "Contains lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: "Contains number",
    test: (password) => /\d/.test(password),
  },
  {
    label: "Contains special character",
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
];

export function PasswordStrengthMeter({ password, showRequirements = true }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };

    const passedRequirements = passwordRequirements.filter(req => req.test(password));
    const score = passedRequirements.length;

    let label = '';
    let color = '';

    switch (score) {
      case 0:
      case 1:
        label = 'Very Weak';
        color = 'bg-red-500';
        break;
      case 2:
        label = 'Weak';
        color = 'bg-orange-500';
        break;
      case 3:
        label = 'Fair';
        color = 'bg-yellow-500';
        break;
      case 4:
        label = 'Good';
        color = 'bg-blue-500';
        break;
      case 5:
        label = 'Strong';
        color = 'bg-green-500';
        break;
      default:
        label = 'Very Weak';
        color = 'bg-red-500';
    }

    return { score, label, color };
  }, [password]);

  const progressValue = (strength.score / passwordRequirements.length) * 100;

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Password strength:</span>
        <span className={`text-sm font-medium ${
          strength.score <= 2 ? 'text-red-600' : 
          strength.score <= 3 ? 'text-yellow-600' : 
          'text-green-600'
        }`}>
          {strength.label}
        </span>
      </div>
      
      <Progress 
        value={progressValue} 
        className="h-2"
        indicatorClassName={strength.color}
      />
      
      {showRequirements && (
        <div className="space-y-1 mt-3">
          <p className="text-sm text-gray-600 font-medium">Password requirements:</p>
          {passwordRequirements.map((requirement, index) => {
            const isPassed = requirement.test(password);
            return (
              <div key={index} className="flex items-center space-x-2">
                {isPassed ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${
                  isPassed ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {requirement.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  return passwordRequirements.filter(req => req.test(password)).length;
}

export function isPasswordStrong(password: string): boolean {
  return getPasswordStrength(password) >= 4;
}
