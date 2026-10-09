/* validation.ts — booking form rules (same as the Assessment 2 website). */

/** "+61 412 345 678" / "0412345678" → "0412 345 678", or null if not an Australian mobile. */
export function normaliseMobile(value: string): string | null {
  const digits = value.replace(/[\s()-]/g, '').replace(/^\+?61/, '0');
  if (!/^04\d{8}$/.test(digits)) return null;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

/** Optional email: blank is fine, otherwise it must look like name@domain.tld */
export const isValidEmail = (value: string) => !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

export type BookingForm = {
  firstName: string; lastName: string; mobile: string; email: string;
  address: string; access: string; notes: string; agree: boolean;
};
export type BookingErrors = Partial<Record<keyof BookingForm | 'window', string>>;

export function validateBooking(form: BookingForm, window: string | null): BookingErrors {
  const errors: BookingErrors = {};
  if (!window) errors.window = 'Choose an arrival window.';
  if (!form.firstName.trim()) errors.firstName = 'Enter your first name.';
  if (!form.lastName.trim()) errors.lastName = 'Enter your last name.';
  if (!normaliseMobile(form.mobile)) errors.mobile = 'Enter an Australian mobile, e.g. 0412 345 678.';
  if (!isValidEmail(form.email)) errors.email = 'Enter a valid email, or leave it blank.';
  if (!form.address.trim()) errors.address = 'Enter the service address.';
  if (!form.agree) errors.agree = 'Please confirm you understand the price is an estimate.';
  return errors;
}
