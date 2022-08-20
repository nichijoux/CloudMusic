import request from '../../utils/request'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 导航标签
    videoGroupList: [],
    // 导航标识
    navId: '',
    // 视频列表
    videoList: [],
    // 要播放的视频id标识
    videoId: '',
    // 记录播放时长
    videoUpdateTime: [],
    // 表示下拉刷新
    isTriggered: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getVideoGroupListData();
  },

  // 获取导航数据
  async getVideoGroupListData() {
    let videoGroupListData = await request('/video/group/list');
    this.setData({
      videoGroupList: videoGroupListData.data.slice(0, 20),
      navId: videoGroupListData.data[0].id
    })
    this.getVideoList(this.data.navId);
  },

  // 点击切换导航的回调
  changeNav(event) {
    // 通过id向event事件传参，传的数字会转为string
    let navId = event.currentTarget.id;
    this.setData({
      navId: navId >>> 0,
      videoList: []
    })

    // 显示正在加载
    wx.showLoading({
      title: '正在加载',
    })
    // 动态获取当前导航的动态数据
    this.getVideoList(this.data.navId);
  },

  // 获取视频列表数据
  async getVideoList(navId) {
    if (!navId) return;

    let VideoListData = await request('/video/group', {
      id: navId
    });
    if (VideoListData.datas.length === 0) {
      wx.showToast({
        title: '暂无推荐视频',
        icon: 'none'
      })
      return;
    }
    // 关闭加载提示
    wx.hideLoading();

    let videoList = VideoListData.datas;
    for (let i = 0; i < videoList.length; i++) {
      // url信息
      let urlInfo = await request("/video/url", {
        id: videoList[i].data.vid
      })
      videoList[i].data.urlInfo = urlInfo.urls[0]
    }
    this.setData({
      videoList: videoList,
      // 开启下拉刷新
      isTriggered: false
    })
  },

  // 点击播放回调
  handlePlay(event) {
    // 播放新视频之前找到上一个正在播放的视频并关闭
    let vid = event.currentTarget.id;
    // 不是同一个视频则关闭
    if (this.vid !== vid && this.videoContext) {
      this.videoContext.stop();
    }
    // 更新要播放的视频
    this.vid = vid;

    this.setData({
      videoId: vid
    })
    // 创建控制video的实例对象
    this.videoContext = wx.createVideoContext(vid);
    // 判断当前的视频是否播放过，有播放记录，有则跳转到之上次播放的位置
    let {
      videoUpdateTime
    } = this.data;
    // 找到视频实例
    let videoItem = videoUpdateTime.find(item => item.vid === vid);
    // 定位到需要的位置
    if (videoItem) {
      this.videoContext.seek(videoItem.currentTime);
    }
  },

  // 监听视频播放进度
  handleTimeUpdate(event) {
    let videoTimeObj = {
      vid: event.currentTarget.id,
      currentTime: event.detail.currentTime
    };
    let {
      videoUpdateTime
    } = this.data;

    let videoItem = videoUpdateTime.find(item => item.vid === videoTimeObj.vid);
    //如果数组中有当前视频对应的时间就更新，没有则添加
    if (videoItem) {
      videoItem.currentTime = videoTimeObj.currentTime;
    } else {
      videoUpdateTime.push(videoTimeObj);
    }
    //更新
    this.setData({
      videoUpdateTime: videoUpdateTime
    })
  },

  // 视频播放结束调用
  handleEnded(event) {
    // 移除播放时长数组中以结束的视频
    let {
      videoUpdateTime
    } = this.data;

    videoUpdateTime.splice(videoUpdateTime.findIndex(item => item.vid === event.currentTarget.id), 1);
    this.setData({
      videoUpdateTime: videoUpdateTime
    })
  },

  // 自定义下拉刷新
  handleRefresher() {
    this.getVideoList(this.data.navId);
  },

  // 上拉触底的回调
  async handleToTower() {
    let navId = this.data.navId
    let VideoListData = await request('/video/group', {
      id: navId
    });
    if (VideoListData.datas.length === 0) {
      wx.showToast({
        title: '暂无推荐视频',
        icon: 'none'
      })
      return;
    }
    // 获取url
    let videoList = VideoListData.datas;
    let finalVideoList = this.data.videoList
    for (let i = 0; i < videoList.length; i++) {
      // url信息
      let urlInfo = await request("/video/url", {
        id: videoList[i].data.vid
      })
      videoList[i].data.urlInfo = urlInfo.urls[0]
      finalVideoList.push(videoList[i])
    }
    // 必须使用this.setData才能被wx监听
    this.setData({
      videoList: finalVideoList
    })
    // 加入videoList
    console.log(this.data.videoList)
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function ({
    from
  }) {
    return {
      title: '来自CloudMusic的转发'
    }
  }
})