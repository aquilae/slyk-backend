export default interface GetUserAttributeVerificationCode {
  CodeDeliveryDetails: {
    AttributeName?: string
    DeliveryMedium?: 'SMS' | 'EMAIL'
    Destination?: string
  }
}
