export type Nullable<T> = undefined | null | T

export interface UserAttributeConfig {
  readonly name: string

  readonly mapTo?: 'name' | 'email' | 'phone'

  readonly label?: Nullable<string>

  readonly required?: Nullable<boolean>

  readonly signUp?: Nullable<boolean>

  readonly immutable?: Nullable<boolean>
}

export default interface CognitoBackendConfig {
  readonly region: string

  readonly userPoolId: string

  readonly clientId: string

  readonly userAttributes?: Nullable<readonly UserAttributeConfig[]>
}
