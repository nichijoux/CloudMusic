import PubSub from 'pubsub-js'
import request from "../../utils/request"

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 导航标签
    tagGroupList: [],
    // 导航标识
    navId: '',
    // 歌曲列表
    songList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getTagGroupList();
  },

  // 获取导航栏数据
  async getTagGroupList() {
    let tagGroupListData = await request('/toplist/detail');
    // 默认选中第一个
    this.setData({
      tagGroupList: tagGroupListData.list,
      navId: tagGroupListData.list[0].id
    })
    // 获取对应歌曲数据
    this.getSongList(this.data.navId);

    // 订阅来自songDetail页面发布的消息
    PubSub.subscribe('switchMusic', (msg, type) => {
      let {
        playList,
        index
      } = this.data;

      if (type === 'pre') {
        // 上一首
        (index === 0) && (index = playList.length);
        index -= 1;
      } else {
        // 下一首
        (index === playList.length - 1) && (index = -1);
        index += 1;
      }

      // 更新下标
      this.setData({
        index: index
      })

      let musicId = playList[index].id;
      // 将音乐id回传给songDetail页面
      PubSub.publish('musicId', musicId);
    })
  },

  // 获取歌曲数据
  async getSongList(navId) {
    if (!navId) return;

    let songListData = await request('/playlist/detail', {
      id: navId
    });

    if (songListData.playlist.tracks.length === 0) {
      wx.showToast({
        title: '暂无榜单数据',
        icon: 'none'
      })
      return;
    }
    // 关闭加载提示
    wx.hideLoading();
    // 设置数据
    this.setData({
      songList: songListData.playlist.tracks,
      //关闭下拉刷新
      isTriggered: false
    });
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
    this.getSongList(this.data.navId);
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
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 取消订阅songDetail的信息,防止和recommendSong冲突
    PubSub.unsubscribe("switchMusic")
  },
})