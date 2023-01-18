export type Reverse<T> = {
  [P in string & T[keyof T]]: {
    [K in keyof T]: T[K] extends P ? K : never
  }[keyof T]
}

export const reverse = <T extends {}>(obj: T): Reverse<T> =>
  Object.fromEntries(Object.entries(obj).map(([key, value]) => [value, key]))

export const MEDIUM_TO_DELIVERY_MEDIUM = {
  sms: 'SMS',
  email: 'EMAIL',
} as const

export const DELIVERY_MEDIUM_TO_MEDIUM = reverse(MEDIUM_TO_DELIVERY_MEDIUM)

export const MFA_TYPE_TO_CODE = {
  sms: 'SMS_MFA',
  totp: 'SOFTWARE_TOKEN_MFA',
} as const

export const MFA_CODE_TO_TYPE = reverse(MFA_TYPE_TO_CODE)
