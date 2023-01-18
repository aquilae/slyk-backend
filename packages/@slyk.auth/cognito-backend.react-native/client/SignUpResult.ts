export default interface SignUpResult {
  CodeDeliveryDetails: {
    AttributeName: string

    DeliveryMedium: 'SMS' | 'EMAIL'

    Destination: string
  }

  UserConfirmed: boolean

  UserSub: string
}
