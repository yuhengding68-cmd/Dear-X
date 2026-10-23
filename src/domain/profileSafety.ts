/** Fields that belong on the private user document only. A public dating profile must not carry them. */

export const PRIVATE_ACCOUNT_KEYS = ['dateOfBirth', 'phone', 'email', 'role', 'provider', 'dob'] as const;

export function hasPrivateAccountField(value: object): boolean {
  return PRIVATE_ACCOUNT_KEYS.some((key) => Object.prototype.hasOwnProperty.call(value, key));
}
