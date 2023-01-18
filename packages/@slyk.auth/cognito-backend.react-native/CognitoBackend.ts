import type CognitoBackendConfig from './CognitoBackendConfig'
import CognitoBackendSession from './CognitoBackendSession'
import CognitoBackendTokens from './CognitoBackendTokens'
import Client from './client/Client'
import type ForgotPasswordResult from './client/ForgotPasswordResult'
import type InitiateAuthResult from './client/InitiateAuthResult'
import type SignUpResult from './client/SignUpResult'
import { DELIVERY_MEDIUM_TO_MEDIUM } from './const'

export type Nullable<T> = undefined | null | T

export default class CognitoBackend {
  readonly ['%backend'] = true

  session: null | CognitoBackendSession = null

  constructor(readonly config: CognitoBackendConfig) {}

  getClient(): Client {
    return new Client(this.config.region, this.config.userPoolId, this.config.clientId)
  }

  async signIn(
    username: string,
    password: string
  ): Promise<
    { challenge: null; session: CognitoBackendSession } | { challenge: {}; session: null }
  > {
    const client = this.getClient()

    const body = {
      AnalyticsMetadata: undefined,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
      ClientId: client.clientId,
      ClientMetadata: undefined,
      UserContextData: undefined,
    }

    const result = await client.call<InitiateAuthResult>('InitiateAuth', body)

    const tokens = new CognitoBackendTokens({
      access: result.AuthenticationResult.AccessToken!,

      expiresAt: result.AuthenticationResult.ExpiresIn
        ? new Date(Date.now() + result.AuthenticationResult.ExpiresIn * 1000)
        : new Date('9999-01-01'),

      id: result.AuthenticationResult.IdToken!,

      refresh: result.AuthenticationResult.RefreshToken!,

      type: result.AuthenticationResult.TokenType!,

      initiateAuthResult: result,
    })

    const session = new CognitoBackendSession(this, result, tokens, username)

    this.session = session

    return {
      challenge: null,
      session,
    }
  }

  async signUp(
    username: string,
    password: string,
    attributes?: Nullable<{ readonly [key: string]: string }>
  ) {
    const client = this.getClient()

    const body = {
      AnalyticsMetadata: undefined,
      ClientId: client.clientId,
      ClientMetadata: undefined,
      Password: password,
      SecretHash: undefined,
      UserAttributes: attributes
        ? Object.entries(attributes).map(([Name, Value]) => ({ Name, Value }))
        : undefined,
      UserContextData: undefined,
      Username: username,
      ValidationData: undefined,
    }

    const signUpResult = await client.call<SignUpResult>('SignUp', body)

    return {
      raw: signUpResult,
      confirmationRequired: !signUpResult.UserConfirmed,
      confirmationDelivery: signUpResult.CodeDeliveryDetails
        ? {
            codeDeliveryDetails: signUpResult.CodeDeliveryDetails,
            attribute: signUpResult.CodeDeliveryDetails.AttributeName || null,
            medium: signUpResult.CodeDeliveryDetails.DeliveryMedium
              ? DELIVERY_MEDIUM_TO_MEDIUM[signUpResult.CodeDeliveryDetails.DeliveryMedium]
              : null,
            destination: signUpResult.CodeDeliveryDetails.Destination || null,
          }
        : null,
    }
  }

  async confirmSignUp(username: string, confirmationCode: string) {
    const client = this.getClient()

    const body = {
      AnalyticsMetadata: undefined,
      ClientId: client.clientId,
      ClientMetadata: undefined,
      ConfirmationCode: confirmationCode,
      ForceAliasCreation: undefined,
      SecretHash: undefined,
      UserContextData: undefined,
      Username: username,
    }

    const confirmSignUpResult = await client.call('ConfirmSignUp', body)

    return {
      raw: confirmSignUpResult,
      username,
    }
  }

  async recoverPassword(username: string) {
    const client = this.getClient()

    const body = {
      AnalyticsMetadata: undefined,
      ClientId: client.clientId,
      ClientMetadata: undefined,
      SecretHash: undefined,
      UserContextData: undefined,
      Username: username,
    }

    const result = await client.call<ForgotPasswordResult>('ForgotPassword', body)

    return {
      forgotPasswordResult: result,

      attribute: result.CodeDeliveryDetails.AttributeName || null,

      medium: result.CodeDeliveryDetails.DeliveryMedium
        ? DELIVERY_MEDIUM_TO_MEDIUM[result.CodeDeliveryDetails.DeliveryMedium]
        : null,

      destination: result.CodeDeliveryDetails.Destination || null,
    }
  }

  async completePasswordRecovery(username: string, code: string, password: string) {
    const client = this.getClient()

    const body = {
      AnalyticsMetadata: undefined,
      ClientId: client.clientId,
      ClientMetadata: undefined,
      ConfirmationCode: code,
      Password: password,
      SecretHash: undefined,
      UserContextData: undefined,
      Username: username,
    }

    const result = await client.call('ConfirmForgotPassword', body)

    return {
      confirmForgotPasswordResult: result,
      username,
    }
  }
}
