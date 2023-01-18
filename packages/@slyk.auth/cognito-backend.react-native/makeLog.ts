import makeLogCore from '@slyk.auth/react-native/makeLog'

const makeLog = (name: string) => makeLogCore(`cognito-backend:${name}`)

export default makeLog
