export default interface ForgotPasswordResult {
  CodeDeliveryDetails: {
    AttributeName: string
    DeliveryMedium: 'SMS' | 'EMAIL'
    Destination: string
  }
}
