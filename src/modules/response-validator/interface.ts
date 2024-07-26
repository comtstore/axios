export interface IReponseValidatorConfig {
    /**
     * 条件，命中条件则执行handler进行处理
     * @param data
     * @returns
     */
    // eslint-disable-next-line no-unused-vars
    condition: (res: any) => boolean
    /**
     * 条件命中时，如何处理
     * @param data
     * @returns
     */
    // eslint-disable-next-line no-unused-vars
    handler: (res: any) => void,
    /**
     * 命中此条件时，表示是否验证成功
     */
    isSuccess?: boolean
  }
  