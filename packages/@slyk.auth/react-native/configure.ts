import Auth from './Auth'
import type AuthConfig from './AuthConfig'

const configure = <T extends AuthConfig>(config: T) => new Auth<T>(config)

export default configure
