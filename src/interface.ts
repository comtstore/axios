export interface ICookieConfig {
    /**
     * 是否允许设置cookie，默认为false
     */
    open: boolean, 
    /**
     *  配置csrf特性，在开启cookie的前提下，允许开启csrf特性
     */
    csrf?: {
      /**
       * 是否开启csrf特性
       */
      open: boolean,
      /**
       * 用户获取一个csrf token
       */
      token: () => string
    }
  }