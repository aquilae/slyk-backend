export default interface UpdateUserAttributesResult {
  CodeDeliveryDetailsList: {
    AttributeName?: string
    DeliveryMedium?: 'SMS' | 'EMAIL'
    Destination?: string
  }[]
}
