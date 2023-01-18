import makeLogCore from '@slyk.core/react-native/makeLog'

const makeLog = (name: string) => makeLogCore(`auth:${name}`)

export default makeLog
