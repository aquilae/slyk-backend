import type AuthConfig from './AuthConfig'

export default class Auth<Config extends AuthConfig> {
  readonly ['%auth'] = true

  declare backend: Config extends { readonly backend: infer U } ? U : undefined

  constructor(readonly config: Config) {
    Object.assign(this, config)
  }
}
