export type Optional<T> = undefined | T

export default interface InitiateAuthResult {
  AuthenticationResult: {
    AccessToken?: Optional<string>

    ExpiresIn?: Optional<number>

    IdToken?: Optional<string>

    NewDeviceMetadata?: Optional<{
      DeviceGroupKey?: Optional<string>

      DeviceKey?: Optional<string>
    }>

    RefreshToken?: Optional<string>

    TokenType?: Optional<string>
  }

  ChallengeName?: Optional<
    | 'SMS_MFA'
    | 'SOFTWARE_TOKEN_MFA'
    | 'SELECT_MFA_TYPE'
    | 'MFA_SETUP'
    | 'PASSWORD_VERIFIER'
    | 'CUSTOM_CHALLENGE'
    | 'DEVICE_SRP_AUTH'
    | 'DEVICE_PASSWORD_VERIFIER'
    | 'ADMIN_NO_SRP_AUTH'
    | 'NEW_PASSWORD_REQUIRED'
  >

  ChallengeParameters?: Optional<{
    [key: string]: string
  }>

  Session: string
}
