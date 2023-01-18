import makeLog from '../makeLog'

const debug = makeLog('client')

export default class Client {
  constructor(public region: string, public userPoolId: null | string, public clientId: string) {}

  async call<T = any>(
    method: string,
    body: { readonly [key: string]: any },
    Result?: new (client: Client, data: any) => T
  ): Promise<T> {
    debug.info(`<call> ${method}`, body)

    const headers = {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${method}`,
      // 'X-Amz-User-Agent': `aws-amplify/5.0.4 js`,
    }

    const init = {
      headers,
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      body: JSON.stringify(body),
    } as const

    const res = await this.fetch(init)

    return Result ? new Result(this, res) : res
  }

  async fetch<T = any>(options: RequestInit, apiMethodName?: string): Promise<T> {
    // debug.debug(
    //   `<fetch> ${options.method} https://cognito-idp.${this.region}.amazonaws.com/`,
    //   options
    // )

    const res = await fetch(`https://cognito-idp.${this.region}.amazonaws.com/`, options)

    const [text, data, json] = await (async () => {
      try {
        const t = await res.text()

        try {
          return [t, JSON.parse(t), true]
        } catch (_) {
          return [t, null, false]
        }
      } catch (_) {
        return [null, null, false]
      }
    })()

    if (json) {
      debug.debug(
        `<fetch> ${options.method} https://cognito-idp.${this.region}.amazonaws.com/${
          apiMethodName ? ` :: ${apiMethodName}` : ``
        }\r\n`,
        JSON.stringify(data, null, 2)
      )
    } else if (text) {
      debug.debug(
        `<fetch> ${options.method} https://cognito-idp.${this.region}.amazonaws.com/${
          apiMethodName ? ` :: ${apiMethodName}` : ``
        }\r\n`,
        text
      )
    } else {
      debug.debug(
        `<fetch> ${options.method} https://cognito-idp.${this.region}.amazonaws.com/${
          apiMethodName ? ` :: ${apiMethodName}` : ``
        }`,
        '- Failed to parse response body'
      )
    }

    if (!res.ok) {
      let error: any

      try {
        // Taken from aws-sdk-js/lib/protocol/json.js
        const code = (data.__type || data.code).split('#').pop()
        error = new Error(data.message || data.Message || null)
        error.name = code
        error.code = code
      } catch (exc) {
        error = new Error(
          `Response status: ${res.status} ${res.statusText}${
            json ? `\r\n${JSON.stringify(data, null, 2)}` : text ? `\r\n${text}` : ``
          }`
        )
      }

      throw error
    }

    if (!json) {
      throw new Error(`Not a JSON response; status: ${res.status} ${res.statusText}`)
    }

    return data
  }
}
