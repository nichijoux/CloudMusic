import request from '../../utils/request'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    //轮播图数据
    bannerList: [],
    //推荐歌单数据
    recommendList: [],
    //排行榜数据
    topList: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    // 滑块数据
    let bannerListData = await request('/banner', {
      type: 2
    });
    this.setData({
      bannerList: bannerListData.banners
    })

    // 推荐歌单数据
    let recommendListData = await request('/personalized', {
      limit: 10
    })
    this.setData({
      recommendList: recommendListData.result
    })
    // 排行榜数据(topList为排行榜的歌单id)
    let topList = [19723756, 3779629, 2884035, 3778678, 991319590]
    let resultArr = [];
    for (let index = 0; index < 5; index++) {
      let topListData = await request('/playlist/detail?', {
        id: topList[index]
      });
      let topListItem = {
        name: topListData.playlist.name,
        tracks: topListData.playlist.tracks.slice(0, 3)
      };
      resultArr.push(topListItem);
      // 拿到数据就渲染到页面，但是渲染次数多
      this.setData({
        topList: resultArr
      })
    }
  },

  // 跳转到每日推荐歌曲页面
  toRecommendSong() {
    this.pageRouter.navigateTo({
      url: '/pages/recommendSong/recommendSong',
    })
  },

  // 跳转到排行榜界面
  toRankList() {
    this.pageRouter.navigateTo({
      url: '/pages/rankList/rankList'
    })
  },

  // 跳转到搜索页面
  toSearch() {
    this.pageRouter.navigateTo({
      url: '/pages/search/search',
    })
  },

  // 跳转到歌曲详情
  toSongDetail(event) {
    this.pageRouter.navigateTo({
      url: '/pages/songDetail/songDetail?song=' + event.currentTarget.id
    })
  },

  // 跳转到歌单歌曲列表页面
  toPlayList(event) {
    this.pageRouter.navigateTo({
      url: '/pages/playlist/playlist?id=' + event.currentTarget.id
    })
  }
})