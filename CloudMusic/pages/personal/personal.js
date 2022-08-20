import request from '../../utils/request'

// 手指起始坐标(Y轴坐标)
let startY = 0;
// 手指结束坐标(Y轴坐标)
let endY = 0;
// 手指移动距离
let moveDistance = 0;

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 移动变化量
    coverTransform: 'translateY(0)',
    coverTransition: '',
    // 用户信息
    userInfo: {},
    // 播放记录
    recentPlayList: [],
    // 控制退出登录显示
    haveLogin: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 读取用户基本信息
    let userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      // 更新用户信息
      this.setData({
        userInfo: JSON.parse(userInfo),
        haveLogin: true
      })
      // 播放记录
      this.getUserRecentPlayList(this.data.userInfo.userId)
    }
  },

  // 点击跳转播放最近播放列表歌曲
  toSongDetail(event) {
    this.pageRouter.navigateTo({
      url: '/pages/songDetail/songDetail?song=' + event.currentTarget.id
    })
  },

  // 获取用户播放记录
  async getUserRecentPlayList(userId) {
    let recentPlayListData = await request('/user/record', {
      uid: userId,
      type: 0
    });
    let recentPlayList = recentPlayListData.allData.slice(0, 10);
    this.setData({
      recentPlayList: recentPlayList
    })
  },

  // 触摸开始
  handleTouchStart(event) {
    // 初始化滑动回弹为空
    this.setData({
      coverTransition: ''
    })
    // 起始手指坐标(touches为数组,因为可能是多个手指在点击)
    startY = event.touches[0].clientY;
  },

  // 触摸开始移动
  handleTouchMove(event) {
    endY = event.touches[0].clientY;
    moveDistance = endY - startY;

    // 不允许向上滑动
    if (moveDistance <= 0) {
      return;
    }
    // 限制最大移动范围
    if (moveDistance >= 80) {
      moveDistance = 80;
    }

    // 动态更新coverTransform
    this.setData({
      coverTransform: `translateY(${moveDistance}rpx)`
    })
  },

  // 触摸结束
  handleTouchEnd() {
    // 重置coverTransform
    this.setData({
      coverTransform: 'translateY(0)',
      // 设置缓慢回弹效果
      coverTransition: 'transform 1s linear'
    })
  },

  // 跳转到登录页面
  toLogin() {
    this.pageRouter.navigateTo({
      url: '/pages/login/login',
    })
  },

  // 退出登录
  logout() {
    // 服务端退出登录状态
    request('/logout');
    // 删除客户端信息
    wx.removeStorageSync('userInfo')
    // 重新设置用户信息
    this.setData({
      userInfo: {},
      haveLogin: false
    })
    // 提示信息
    wx.showToast({
      title: '退出登录',
      icon: 'success'
    })
    // 重新跳转到登录界面
    this.pageRouter.navigateTo({
      url: '/pages/login/login',
    })
  }
})