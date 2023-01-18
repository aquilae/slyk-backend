import { Tokens as Base } from '@slyk.auth/react-native'
import type InitiateAuthResult from './client/InitiateAuthResult'

export default class CognitoBackendTokens extends Base {
  initiateAuthResult: InitiateAuthResult

  refreshTokensResult?: undefined | InitiateAuthResult

  constructor({
    initiateAuthResult,
    refreshTokensResult,
    ...params
  }: ConstructorParameters<typeof Base>[0] & {
    readonly initiateAuthResult: InitiateAuthResult
    readonly refreshTokensResult?: undefined | InitiateAuthResult
  }) {
    super(params)

    this.initiateAuthResult = initiateAuthResult
    this.refreshTokensResult = refreshTokensResult
  }
}
