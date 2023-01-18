export default interface GetUserResult {
  MFAOptions: {
    AttributeName: string

    DeliveryMedium: string
  }[]

  PreferredMfaSetting: string

  UserAttributes: {
    Name: string

    Value: string
  }[]

  UserMFASettingList: ('SMS_MFA' | 'SOFTWARE_TOKEN_MFA')[]

  Username: string
}
