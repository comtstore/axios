import Pipeline from '@comtstore/pipeline'
import { type IReponseValidatorConfig } from './interface'

/**
 * 回传数据的验证器
 */
class ResponseValidator {
  /**
   * 
   * @param initialValidators 基础的验证器
   */
  public constructor(initialValidators: IReponseValidatorConfig[] = []) {
    this.validators = [...initialValidators]
  }

  public validators: IReponseValidatorConfig[] = []

  /**
   * 在pl上加载中间件
   * @param pl 流程控制器实例
   * @param validators 临时需要加入的验证器，会加在全局中间件末尾
   * @returns 返回是否加载了至少1个验证器，没有加载任何验证器返回false
   */
  private readonly loadMiddlewares = (pl: Pipeline, validators: IReponseValidatorConfig[]): boolean => {
    const loadedValidators = [ ...this.validators, ...validators ]
    if(loadedValidators.length === 0){
      // 没有加载任何中间件
      return false
    }
    for (const validateConfig of loadedValidators) {
      pl.conditionalUse(
        (ctx) => validateConfig.condition ? validateConfig.condition(ctx.ip.res) : true,
        async (ctx, next) => {
          validateConfig.handler(ctx.ip.res)
          ctx.op.isValidate = validateConfig.isSuccess
          await next()
        }
      )
    }
    return true
  }

  /**
   * 验证方法，执行该方法即开始验证
   * @param res 拿到的返回数据
   * @param validators 对该res进行验证时临时引入部分验证器，这些验证器会在实例创建时的验证器之后进行判断
   * @returns
   */
  public async validate(res: any, validators: IReponseValidatorConfig[] = []): Promise<boolean> {
    const pl = new Pipeline()
    pl.initial({ res })
    // 没有加载任何验证器，直接结束
    if(!this.loadMiddlewares(pl, validators)){ 
      return res 
    }
    try {
      void pl.execute()
      await pl.output()
    } catch (err) {
      console.error('验证器流发生错误: ', err)
    }
    return res 
  }
}

export default ResponseValidator
