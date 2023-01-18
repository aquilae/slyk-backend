import type CognitoBackend from './CognitoBackend'
import CognitoBackendTokens from './CognitoBackendTokens'
import CognitoBackendUser from './CognitoBackendUser'
import type InitiateAuthResult from './client/InitiateAuthResult'

export default class CognitoBackendSession {
  claims: { [key: string]: any }

  user: CognitoBackendUser

  constructor(
    readonly backend: CognitoBackend,
    readonly signInResult: InitiateAuthResult,
    public tokens: CognitoBackendTokens,
    username: string
  ) {
    this.claims = tokens.decode(tokens.id)

    this.user = new CognitoBackendUser(
      this.backend,
      this,
      this.claims.username || username,
      this.claims
    )
  }

  getTokens(checkExpiration: false): CognitoBackendTokens & PromiseLike<CognitoBackendTokens>

  getTokens(checkExpiration: undefined | true): Promise<CognitoBackendTokens>

  getTokens(): Promise<CognitoBackendTokens>

  getTokens(checkExpiration?: undefined | boolean): any {
    if (checkExpiration === false) {
      const promise = Promise.resolve(this.tokens)

      return {
        ...this.tokens,
        then(...args: any[]) {
          return promise.then(...args)
        },
      }
    }

    return this.ensureTokensNotExpired().then(() => this.tokens)
  }

  async ensureTokensNotExpired() {
    if (this.tokens.expired()) {
      await this.refreshTokens()
    }
  }

  async refreshTokens() {
    const client = this.backend.getClient()

    const body = {
      AnalyticsMetadata: undefined,
      AuthFlow: 'REFRESH_TOKEN',
      AuthParameters: {
        REFRESH_TOKEN: this.tokens.refresh,
        SECRET_HASH: undefined,
        DEVICE_KEY: undefined,
      },
      ClientId: client.clientId,
      ClientMetadata: undefined,
      UserContextData: undefined,
    }

    const result = await client.call<InitiateAuthResult>('InitiateAuth', body)

    const tokens = new CognitoBackendTokens({
      access: result.AuthenticationResult.AccessToken || this.tokens.access,

      expiresAt: result.AuthenticationResult.ExpiresIn
        ? new Date(Date.now() + result.AuthenticationResult.ExpiresIn * 1000)
        : this.tokens.expiresAt,

      id: result.AuthenticationResult.IdToken || this.tokens.id,

      refresh: result.AuthenticationResult.RefreshToken || this.tokens.refresh,

      type: result.AuthenticationResult.TokenType || this.tokens.type,

      initiateAuthResult: this.tokens.initiateAuthResult,

      refreshTokensResult: result,
    })

    this.tokens = tokens
  }
}
