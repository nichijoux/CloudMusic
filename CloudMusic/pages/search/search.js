import request from '../../utils/request'

// 防抖节流定时器
let timer = null; 

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // placeholder内容
    placeholderContent: '', 
    // 热搜榜列表
    hotList: [],
    // 表单项内容
    searchContent: '', 
    // 搜索到的歌曲列表
    searchList: [],
    // 历史搜索记录
    historyList: [], 
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //获取初始化数据
    this.getInitData();
    //获取本地历史记录
    this.getSearchHistory();
  },

  // 获取初始化数据
  async getInitData() {
    let placeholderContentData = await request('/search/default');
    let hostListData = await request('/search/hot/detail');
    this.setData({
      placeholderContent: placeholderContentData.data.showKeyword,
      hotList: hostListData.data
    })
  },

  // 获取本地历史记录
  getSearchHistory() {
    let historyList = wx.getStorageSync('searchHistory');
    if (historyList) {
      this.setData({
        historyList: historyList
      })
    }
  },

  // 表单项内容发生改变
  handleInputChange(event) {
    this.setData({
      searchContent: event.detail.value.trim()
    })

    if (timer) {
      clearTimeout(timer);
    }

    // 函数防抖节流
    timer = setTimeout(() => {
      this.getSearchListData();
    }, 500);
  },

  // 发请求获取搜索匹配到的数据
  async getSearchListData() {
    // 当搜索内容为空时就不发送请求并清空内容
    if (!this.data.searchContent) {
      this.setData({
        searchList: []
      })
      return;
    }

    let {
      searchContent,
      historyList
    } = this.data;

    let searchListData = await request('/search', {
      keywords: searchContent,
      limit: 10
    });
    this.setData({
      searchList: searchListData.result.songs
    })

    // 将搜索关键字添加到历史记录
    if (historyList.indexOf(searchContent) !== -1) {
      historyList.splice(historyList.indexOf(searchContent), 1)
    }
    historyList.unshift(searchContent);

    this.setData({
      historyList: historyList
    })

    // 存储到本地
    wx.setStorageSync('searchHistory', historyList)
  },

  // 清空搜索内容
  handleClear() {
    this.setData({
      searchContent: '',
      searchList: []
    })
  },

  // 删除搜索历史记录
  handleDelete() {
    // 是否确认清空
    wx.showModal({
      content: '确认清空记录吗?',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            historyList: []
          })
          wx.removeStorageSync('searchHistory');
        }
      }
    })
  },

  // 点击热搜榜进行搜索
  searchHotSong(event) {
    this.setData({
      searchContent: event.currentTarget.dataset.hotwords
    })
    // 发请求获取搜索匹配到的数据
    this.getSearchListData();
  },

  // 点击历史记录进行搜索
  searchHistory(event) {
    this.setData({
      searchContent: event.currentTarget.dataset.historyword
    })

    this.getSearchListData();
  },

  // 跳转到歌曲详情页面
  toSongDetail(event) {
    wx.navigateTo({
      url: '/pages/songDetail/songDetail?song=' + event.currentTarget.id
    })
  },
})