import PubSub from 'pubsub-js'
import request from '../../utils/request'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    listid: '', //歌单id
    playList: [], //歌曲对象
    listImg: '', //歌单图片
    discribe: '', //歌单描述
    index: 0, //下标
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取歌单id
    let listid = options.id;
    this.setData({
      listid: listid
    })

    // 获取歌单歌曲
    this.getPlayList(listid);

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

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // 取消订阅songDetail的信息,防止和recommendSong冲突
    PubSub.unsubscribe("switchMusic")
  },

  //获取歌单所对应的歌曲
  async getPlayList(listid) {
    let playListData = await request("/playlist/detail", {
      id: listid
    });
    this.setData({
      playList: playListData.playlist.tracks,
      listImg: playListData.playlist.coverImgUrl,
      discribe: playListData.playlist.name
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