import debug from 'debug'

const makeLog = false
  ? (name: string) => ({
      debug: debug(`slyk:${name}:debug`),
      info: debug(`slyk:${name}:info`),
    })
  : (name: string) => ({
      /* eslint-disable no-console */

      debug: (format: any, ...args: any[]) =>
        console.log(`[slyk:${name}:debug] ${format}`, ...args),

      info: (format: any, ...args: any[]) => console.log(`[slyk:${name}:info] ${format}`, ...args),

      /* eslint-enable no-console */
    })

export default makeLog
