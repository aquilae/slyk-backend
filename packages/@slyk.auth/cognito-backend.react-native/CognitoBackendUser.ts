import type CognitoBackend from './CognitoBackend'
import type { UserAttributeConfig } from './CognitoBackendConfig'
import type CognitoBackendSession from './CognitoBackendSession'
import type GetUserAttributeVerificationCodeResult from './client/GetUserAttributeVerificationCodeResult'
import type GetUserResult from './client/GetUserResult'
import type UpdateUserAttributesResult from './client/UpdateUserAttributesResult'
import {
  DELIVERY_MEDIUM_TO_MEDIUM,
  type MEDIUM_TO_DELIVERY_MEDIUM,
  MFA_CODE_TO_TYPE,
  MFA_TYPE_TO_CODE,
} from './const'

export interface UpdateAttributesResult<User> {
  user: User

  verificationRequired: {
    codeDeliveryDetails: UpdateUserAttributesResult['CodeDeliveryDetailsList'][number]

    attribute:
      | null
      | (Partial<Omit<UserAttributeConfig, 'name'>> & { name: string })
      | UserAttributeConfig

    medium: null | keyof typeof MEDIUM_TO_DELIVERY_MEDIUM

    destination: null | string
  }[]
}

export default class CognitoBackendUser {
  getUserResult: null | GetUserResult = null

  setUserMFAPreferenceResult: null | unknown = null

  updateUserAttributesResult: null | UpdateUserAttributesResult = null

  getUserAttributeVerificationCodeResult: null | GetUserAttributeVerificationCodeResult = null

  verifyUserAttributeResult: null | unknown = null

  nameAttributeName: null | string

  emailAttributeName: null | string

  phoneAttributeName: null | string

  attributes: { [key: string]: any }

  mfa?: {
    options: {
      code: 'SMS_MFA' | 'SOFTWARE_TOKEN_MFA'
      type: 'sms' | 'totp' | 'other'
      preferred: boolean
    }[]
  }

  get name(): null | string {
    return (this.nameAttributeName && this.attributes[this.nameAttributeName]) || null
  }

  get email(): null | string {
    return (this.emailAttributeName && this.attributes[this.emailAttributeName]) || null
  }

  get phone(): null | string {
    return (this.phoneAttributeName && this.attributes[this.phoneAttributeName]) || null
  }

  constructor(
    readonly backend: CognitoBackend,
    readonly session: CognitoBackendSession,
    public username: string,
    attributes?: { readonly [key: string]: any }
  ) {
    this.attributes = attributes || {}

    this.nameAttributeName =
      this.backend.config?.userAttributes?.find(x => x.mapTo === 'name')?.name ?? null

    this.emailAttributeName =
      this.backend.config?.userAttributes?.find(x => x.mapTo === 'email')?.name ?? null

    this.phoneAttributeName =
      this.backend.config?.userAttributes?.find(x => x.mapTo === 'phone')?.name ?? null
  }

  async getMfa(): Promise<{
    options: {
      code: 'SMS_MFA' | 'SOFTWARE_TOKEN_MFA'
      type: 'sms' | 'totp' | 'other'
      preferred: boolean
    }[]
  }> {
    if (!this.mfa) {
      await this.refresh()
    }

    return this.mfa!
  }

  async updateMfa(
    options: readonly { readonly type: 'sms' | 'totp' | 'other'; readonly preferred?: boolean }[]
  ): Promise<void> {
    const tokens = await this.session.getTokens(true)

    const client = this.backend.getClient()

    const body = {
      AccessToken: tokens.access,
      SMSMfaSettings: {
        Enabled: false,
        PreferredMfa: false,
      },
      SoftwareTokenMfaSettings: {
        Enabled: false,
        PreferredMfa: false,
      },
    }

    options.forEach(option => {
      let key: Exclude<keyof typeof body, 'AccessToken'>

      switch (option.type) {
        case 'sms':
          key = 'SMSMfaSettings'
          break

        case 'totp':
          key = 'SoftwareTokenMfaSettings'
          break

        default:
          throw new Error(`Setting MFA of type ${option.type} is not supported`)
      }

      body[key].Enabled = true
      body[key].PreferredMfa = option.preferred ?? false
    })

    this.setUserMFAPreferenceResult = await client.call('SetUserMFAPreference', body)

    this.mfa = {
      options: options.map(option => ({
        code: MFA_TYPE_TO_CODE[option.type as 'sms' | 'totp'],
        type: option.type,
        preferred: option.preferred ?? false,
      })),
    }
  }

  async refresh(): Promise<this> {
    const tokens = await this.session.getTokens(true)

    const client = this.backend.getClient()

    const body = {
      AccessToken: tokens.access,
    }

    this.getUserResult = await client.call<GetUserResult>('GetUser', body)

    this.username = this.getUserResult.Username

    this.attributes = Object.fromEntries(
      this.getUserResult.UserAttributes?.map(attr => [attr.Name, attr.Value]) ?? []
    )

    this.mfa = {
      options:
        this.getUserResult.UserMFASettingList?.map(code => ({
          code,
          type: MFA_CODE_TO_TYPE[code],
          preferred: this.getUserResult!.PreferredMfaSetting === code,
        })) ?? [],
    }

    return this
  }

  async checkIfAllRequiredAttributesAreSet(): Promise<boolean> {
    const attrs = this.backend.config?.userAttributes

    if (attrs) {
      if (attrs.some(attr => attr.required && !this.attributes[attr.name])) {
        await this.refresh()

        if (attrs.some(attr => attr.required && !this.attributes[attr.name])) {
          return false
        }
      }
    }

    return true
  }

  async updateAttributes(attributes: {
    readonly [key: string]: any
  }): Promise<UpdateAttributesResult<this>> {
    const tokens = await this.session.getTokens(true)

    const client = this.backend.getClient()

    const body = {
      AccessToken: tokens.access,
      ClientMetadata: undefined,
      UserAttributes: Object.entries(attributes).map(([name, Value]) => {
        const mapping = this.backend.config?.userAttributes?.find(x => x.mapTo === name)?.name
        return { Name: mapping ?? name, Value }
      }),
    }

    const result = await client.call<UpdateUserAttributesResult>('UpdateUserAttributes', body)

    this.updateUserAttributesResult = result

    body.UserAttributes.forEach(attr => {
      if (!result.CodeDeliveryDetailsList?.some(x => x.AttributeName === attr.Name)) {
        this.attributes[attr.Name] = attr.Value
      }
    })

    return {
      user: this,

      verificationRequired:
        result.CodeDeliveryDetailsList?.map(each => ({
          codeDeliveryDetails: each,

          attribute: each.AttributeName
            ? this.backend.config?.userAttributes?.find(x => x.name === each.AttributeName) ?? {
                name: each.AttributeName,
              }
            : null,

          medium: each.DeliveryMedium ? DELIVERY_MEDIUM_TO_MEDIUM[each.DeliveryMedium] : null,

          destination: each.Destination || null,
        })) ?? [],
    }
  }

  async requestAttributeVerification(attributeName: string) {
    const attr = this.backend.config?.userAttributes?.find(x => x.mapTo === attributeName) ?? {
      name: attributeName,
    }

    const tokens = await this.session.getTokens(true)

    const client = this.backend.getClient()

    const body = {
      AccessToken: tokens.access,
      AttributeName: attr.name,
      ClientMetadata: undefined,
    }

    const result = await client.call<GetUserAttributeVerificationCodeResult>(
      'GetUserAttributeVerificationCode',
      body
    )

    this.getUserAttributeVerificationCodeResult = result

    return {
      getUserAttributeVerificationCodeResult: result,

      codeDeliveryDetails: result.CodeDeliveryDetails,

      attribute: result.CodeDeliveryDetails.AttributeName
        ? this.backend.config?.userAttributes?.find(
            x => x.name === result.CodeDeliveryDetails.AttributeName
          ) ?? {
            name: result.CodeDeliveryDetails.AttributeName,
          }
        : null,

      medium: result.CodeDeliveryDetails.DeliveryMedium
        ? DELIVERY_MEDIUM_TO_MEDIUM[result.CodeDeliveryDetails.DeliveryMedium]
        : null,

      destination: result.CodeDeliveryDetails.Destination || null,
    }
  }

  async verifyAttribute(attributeName: string, code: string) {
    const attr = this.backend.config?.userAttributes?.find(x => x.mapTo === attributeName) ?? {
      name: attributeName,
    }

    const tokens = await this.session.getTokens(true)

    const client = this.backend.getClient()

    const body = {
      AccessToken: tokens.access,
      AttributeName: attr.name,
      Code: code,
    }

    const result = await client.call('VerifyUserAttribute', body)

    this.verifyUserAttributeResult = result

    return {
      verifyUserAttributeResult: result,
    }
  }
}
