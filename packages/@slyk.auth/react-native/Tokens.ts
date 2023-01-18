import { atob } from './base64'

export default class Tokens {
  access: string

  expiresAt: Date

  id: string

  refresh: string

  type: string

  constructor(params: {
    readonly access: string
    readonly expiresAt: Date
    readonly id: string
    readonly refresh: string
    readonly type: string
  }) {
    this.access = params.access
    this.expiresAt = params.expiresAt
    this.id = params.id
    this.refresh = params.refresh
    this.type = params.type
  }

  expired() {
    return this.expiresAt <= new Date()
  }

  decode(token: undefined | null | ''): null

  decode(token: string): { [key: string]: any }

  decode(token: undefined | null | string): null | { [key: string]: any }

  decode(token: undefined | null | string): any {
    if (token) {
      const [, base64Url] = token.split('.')

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')

      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join('')
      )

      return JSON.parse(json)
    }

    return null!
  }
}
