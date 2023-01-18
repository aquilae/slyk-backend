import Slyk from './Slyk'

const configure = <
  T extends {
    readonly auth?: { readonly ['%auth']: true }
  }
>(
  config: T
): (abstract new () => {}) & {
  readonly [K in keyof T]: T[K]
} => {
  const result = class extends Slyk {}

  Object.defineProperties(
    result,
    Object.fromEntries(
      Object.entries(config).map(([key, value]) => [
        key,
        {
          value,
          writable: true,
          enumerable: false,
          configurable: true,
        },
      ])
    )
  )

  return result as any
}

export default configure
