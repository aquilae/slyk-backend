import CognitoBackend from './CognitoBackend'
import type CognitoBackendConfig from './CognitoBackendConfig'

const configure = (config: CognitoBackendConfig) => new CognitoBackend(config)

export default configure
