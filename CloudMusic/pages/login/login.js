import request from "../../utils/request"

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 手机号
    phone: '',
    // 密码
    password: ''
  },

  // 表单项内容发生改变
  handleInput(event) {
    let type = event.currentTarget.id;
    this.setData({
      [type]: event.detail.value
    })
  },

  // 登录
  async login() {
    // 得到数据
    let {
      phone,
      password
    } = this.data;
    // 前端验证
    // 手机号不为空
    if (!phone || phone.length === 0) {
      wx.showToast({
        title: '手机号不能为空',
        icon: 'none'
      })
      return;
    }
    // 正则验证是一个手机号
    // 正则表达式
    let phoneReg = /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/;
    if (!phoneReg.test(phone)) {
      wx.showToast({
        title: '手机号格式错误',
        icon: 'none'
      })
      return;
    }
    // 密码不为空
    if (!password || password.length === 0) {
      wx.showToast({
        title: '密码不能为空',
        icon: 'none'
      })
      return;
    }
    // 后端验证
    let result = await request('/login/cellphone', {
      phone,
      password,
      isLogin: true
    });
    if (result.code === 200) {
      wx.showToast({
        title: '登陆成功',
      })
      // 存储个人信息
      wx.setStorageSync('userInfo', JSON.stringify(result.profile))
      // 从登录页返回个人中心页
      wx.reLaunch({
        url: '/pages/personal/personal'
      })
    } else {
      wx.showToast({
        title: result.message || '登陆失败，请重新登录',
        icon: 'none'
      })
    }
  }
})