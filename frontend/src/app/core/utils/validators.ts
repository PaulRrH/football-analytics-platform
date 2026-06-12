import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordMatchValidator(
  passwordKey: string,
  confirmKey: string,
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey)?.value;
    const confirm = group.get(confirmKey)?.value;

    if (!password || !confirm || password === confirm) {
      return null;
    }

    return { passwordMismatch: true };
  };
}

export function differentFieldsValidator(keyA: string, keyB: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const valueA = group.get(keyA)?.value;
    const valueB = group.get(keyB)?.value;

    if (!valueA || !valueB || valueA !== valueB) {
      return null;
    }

    return { sameValue: true };
  };
}

export function dateRangeValidator(startKey: string, endKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get(startKey)?.value;
    const end = group.get(endKey)?.value;

    if (!start || !end || new Date(start) < new Date(end)) {
      return null;
    }

    return { invalidDateRange: true };
  };
}
