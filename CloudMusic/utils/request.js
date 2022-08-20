// 发送ajax请求
import config from '../utils/config'

export default (url, data = {}, method = 'GET') => {
  return new Promise((resolve, reject) => {
    //初始化promise实例的状态为pending
    wx.request({
      // 请求地址
      url: config.baseURL + url,
      // 请求参数对象
      data: data,
      // 请求方法
      method: method,
      header: {
        // 设置请求头的cookie属性
        cookie: wx.getStorageSync('cookies') ?
          wx.getStorageSync('cookies') : ""
      },

      success: (res) => {
        if (data.isLogin) {
          // 登录请求,将用户cookie存入
          wx.setStorage({
            key: 'cookies',
            data: res.cookies,
          })
        }
        resolve(res.data);
      },
      fail: (err) => {
        reject(err);
      }
    })
  })
}