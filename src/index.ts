import axios from 'axios'
import ResponseValidator from './modules/response-validator'
import { IReponseValidatorConfig } from './modules/response-validator/interface'
const CancelToken = axios.CancelToken // 引入取消请求方法

/**
 * 基础请求的封装
 */
export class BasicAxiosRequest {
   public axios: AxiosRequest

   constructor(axios: AxiosRequest){
      this.axios = axios
   }
}

class AxiosRequest {
  public constructor (options: {
    baseUrl: string,
    publicPath?: RegExp[],
    token?: string | (() => string), // 获取token的函数
    // eslint-disable-next-line no-unused-vars
    onerror?: (err: any) => void,
    responseValidators?: Array<IReponseValidatorConfig> // 全局提供请求验证器
  }) {
    this.baseUrl = options.baseUrl
    this.token = options.token ?? false
    this.publicPath = options.publicPath ?? []
    this.onerror = options.onerror ?? (() => {})
    this.pending = {}
    if(options.responseValidators){
      this.globalResponseValidators = options.responseValidators
    }
    this.initailResponseValidator()
  }

  public token: string | (() => string) | boolean
  public baseUrl: string
  public publicPath: RegExp[]
  public pending: {
    [key: string]: any
  } = {}
  // eslint-disable-next-line no-unused-vars
  public onerror: (err: any) => void = () => {}
  private globalResponseValidators: Array<IReponseValidatorConfig> = []
  private responseValidator: ResponseValidator

  // 设定基础配置
  private getInsideConfig () {
    const config = {
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      timeout: 10000
    }
    return config
  }

  /**
   * 删除请求
   * @param {String} key 需要被取消的请求
   * @param {Boolean} isRequest 是否来自于Request
   */
  private removePending (key, isRequest = false) {
    if (this.pending[key] && isRequest) { // 如果该请求存在并且来自于request，就删除该请求，可以传递message参数或者不传
        try {
            this.pending[key]('取消重复请求') //在开发模式下容易报错
        } catch(err){
            console.log('[axios]', err)
        }
    }
    delete this.pending[key]
  }

  /**
   * 获取token
   * @returns 
   */
  private getToken(): string {
    if(typeof this.token === 'function'){
      return this.token()
    } else if(typeof this.token === 'string'){
      return this.token
    }
    return ''
  }

  private initailResponseValidator = () => {
    this.responseValidator = new ResponseValidator(this.globalResponseValidators)
  }

  // 设定拦截器（不暴露）
  private interceptors (instance, validators: Array<IReponseValidatorConfig>) {
    // 请求拦截器
    instance.interceptors.request.use(
      (config) => {
        let isPublic = false
        this.publicPath.map((path) => {
          isPublic = isPublic || path.test(config.url)
        })

        if (!isPublic && this.token) {
          config.headers.Authorization = this.getToken()
        }

        const key = config.url + '&' + config.method // 利用请求url和方法来唯一标示一个请求
        this.removePending(key, true) // 删除之前发出的该请求

        config.cancelToken = new CancelToken((c) => {
          this.pending[key] = c // 将该axios请求的取消方法保存下来供下次使用
        }) // 为该请求创建一个取消方法

        return config
      },
      (err) => {
        this.onerror(err)
        return Promise.reject(err)
      }
    )
    // 响应请求的拦截器
    instance.interceptors.response.use(
      (res) => {
        const key = res.config.url + '&' + res.config.method
        this.removePending(key)
        // 执行验证器对数据进行处理
        res = this.responseValidator.validate(res, validators)
        if (res.status === 200) {
          return Promise.resolve(res.data)
        } else {
          return Promise.reject(res)
        }
      },
      (err) => {
        this.onerror(err)
        return Promise.reject(err)
      }
    )
  }

  // 创建实例(不暴露)
  private request (options, validators: Array<IReponseValidatorConfig>): Promise<{code: number, data?: any, message?: string, stack?: object}> {
    const instance = axios.create()
    const newOptions = Object.assign(this.getInsideConfig(), options)
    this.interceptors(instance, validators)
    return instance(newOptions)
  }

  public get (url: string, config: { [key: string]: any }, validators: Array<IReponseValidatorConfig> = []): Promise<{code: number, data?: any, message?: string, stack?: object, [key: string]: any}> {
    const options = Object.assign({
      method: 'get',
      url
    },
    config
    )
    return this.request(options, validators)
  }

  public post (url: string, data: { [key: string]: any }, validators: Array<IReponseValidatorConfig> = []): Promise<{code: number, data?: any, message?: string, stack?: object, [key: string]: any}> {
    return this.request({
      method: 'post',
      url,
      data
    }, validators)
  }
}

export default AxiosRequest
