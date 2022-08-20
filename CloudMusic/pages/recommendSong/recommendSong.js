import PubSub from 'pubsub-js';
import request from '../../utils/request'
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 年
    year: '',
    // 月
    month: '',
    // 日
    day: '',
    // 推荐列表数据
    recommendList: [],
    // 音乐下标
    index: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 判断用户是否登录
    let userIinfo = wx.getStorageSync('userInfo');
    if (!userIinfo) {
      wx.showToast({
        title: '请先进行登录',
        icon: 'none',
        success: () => {
          // 跳转至登录界面
          wx.reLaunch({
            url: '/pages/login/login',
          })
        }
      })
    }
    let nowTime = new Date();
    // 更新日期
    this.setData({
      day: nowTime.getDate(),
      month: nowTime.getMonth() + 1,
      year: nowTime.getFullYear()
    })

    // 获取每日推荐的数据
    this.getRecommendList();

    // 订阅来自songDetail页面发布的消息
    PubSub.subscribe('switchMusic', (msg, type) => {
      let {
        recommendList,
        index
      } = this.data;
      if (type === 'pre') {
        // 上一首
        (index === 0) && (index = recommendList.length);
        index -= 1;
      } else {
        // 下一首
        (index === recommendList.length - 1) && (index = -1);
        index += 1;
      }

      // 更新下标
      this.setData({
        index: index
      })

      let musicId = recommendList[index].id;
      // 将音乐id回传给songDetail页面
      PubSub.publish('musicId', musicId);
    })
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // 取消订阅songDetail的信息,防止和recommendSong冲突
    PubSub.unsubscribe("switchMusic")
  },

  // 获取每日推荐数据
  async getRecommendList() {
    let recommendListData = await request('/recommend/songs');
    this.setData({
      recommendList: recommendListData.data.dailySongs
    })
  },
  // 跳转至songDetail页面
  toSongDetail(event) {
    let {
      song,
      index
    } = event.currentTarget.dataset;

    this.setData({
      index: index
    })
    // 路由跳转传参：query参数
    this.pageRouter.navigateTo({
      url: '/pages/songDetail/songDetail?song=' + song.id
    })
  }
})