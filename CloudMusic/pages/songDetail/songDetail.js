import PubSub from 'pubsub-js';
import moment from 'moment';
import request from '../../utils/request';
//获取全局实例
const appInstance = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 标识播放状态
    isPlay: false,
    // 歌曲详情对象
    song: {},
    // 歌曲Id
    musicId: '',
    // 音乐链接
    musicLink: '',
    // 当前时长
    currentTime: '00:00',
    // 总时长
    durationTime: '00:00',
    // 实时进度条宽度
    currentWidth: 0,
    // 歌词
    lyric: [],
    // 歌词对应的时间
    lyricTime: 0,
    // 当前歌词对象
    currentLyric: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // options路由跳转参数
    let musicId = options.song;
    this.setData({
      musicId: musicId
    })
    this.getMusicInfo(musicId);
    this.getLyric(musicId);
    // 判断当前页面音乐是否在播放
    if (appInstance.globalData.isMusicPlay && appInstance.globalData.musicId === musicId) {
      // 修改当前页面音乐播放状态
      this.setData({
        isPlay: true
      })
    }

    // 创建控制音乐播放实例对象
    this.backgroundAudioManager = wx.getBackgroundAudioManager();
    // 监视音乐播放与暂停
    this.backgroundAudioManager.onPlay(() => {
      // 修改音乐播放状态
      this.changePlayState(true);
      appInstance.globalData.musicId = musicId;
    });
    // 暂停播放音乐监听
    this.backgroundAudioManager.onPause(() => {
      this.changePlayState(false);
    });
    // 停止播放音乐监听
    this.backgroundAudioManager.onStop(() => {
      this.changePlayState(false);
    });
    // 音乐播放自然结束
    this.backgroundAudioManager.onEnded(() => {
      // 切歌
      PubSub.publish('switchMusic', 'next');
      // 重置所有数据
      this.setData({
        currentWidth: 0,
        currentTime: '00:00',
        lyric: [],
        lyricTime: 0,
        isPlay: false,
        currentLyric: ""
      })
      // 获取歌曲
      this.getMusicInfo(musicId);
      // 获得歌词
      this.getLyric(musicId);
      // 自动播放当前音乐
      this.musicControl(true, musicId);
    })
    // 监听音乐实时播放的进度
    this.backgroundAudioManager.onTimeUpdate(() => {
      this.musicPlayTime()
    })

  },

  // 观察音乐播放进度
  musicPlayTime() {
    // 获取歌词对应时间
    let lyricTime = Math.ceil(this.backgroundAudioManager.currentTime);
    let currentTime = moment(this.backgroundAudioManager.currentTime * 1000).format('mm:ss');
    let currentWidth = (this.backgroundAudioManager.currentTime / this.backgroundAudioManager.duration) * 450;

    this.setData({
      lyricTime,
      currentTime,
      currentWidth
    })
    // 获取当前歌词
    this.getCurrentLyric();
  },

  // 修改播放状态
  changePlayState(isPlay) {
    this.setData({
      isPlay: isPlay
    })
    // 修改全局播放状态
    appInstance.globalData.isMusicPlay = isPlay;
  },
  // 点击暂停/播放的回调
  handleMusicPlay() {
    let {
      musicId
    } = this.data;
    this.musicControl(!this.data.isPlay, musicId);
  },

  // 请求歌曲信息
  async getMusicInfo(musicId) {
    let songData = await request('/song/detail', {
      ids: musicId
    });
    // 设置歌曲时间
    let durationTime = moment(songData.songs[0].dt).format('mm:ss');
    // 设置数据
    this.setData({
      song: songData.songs[0],
      durationTime: durationTime
    })
    // 动态修改窗口标题
    wx.setNavigationBarTitle({
      title: this.data.song.name
    })
  },

  // 歌曲播放控制功能
  async musicControl(isPlay, musicId) {
    if (isPlay) {
      // 播放性能优化,如果音乐链接不存在
      if (!this.data.musicLink) {
        // 音乐播放
        // 获取音频资源
        let musicLinkData = await request('/song/url', {
          id: musicId
        })
        let musicLink = musicLinkData.data[0].url;
        // 无法获取连接则
        if (musicLink === null) {
          wx.showToast({
            title: '由于版权或会员问题暂获取不到此资源',
            icon: 'none'
          })
          return;
        }
        // 设置链接
        this.setData({
          musicLink: musicLink
        })
      }

      this.setData({
        isPlay: isPlay
      })
      // 歌曲播放
      this.backgroundAudioManager.src = this.data.musicLink;
      this.backgroundAudioManager.title = this.data.song.name;
    } else {
      // 音乐暂停
      this.backgroundAudioManager.pause();
    }
  },

  // 歌曲切换
  handleSwitch(event) {
    // 切换类型
    let type = event.currentTarget.id;
    // 关闭当前播放音乐
    this.backgroundAudioManager.stop();
    // 重置musicLink
    this.setData({
      musicLink: ""
    })
    // 订阅来自recommendSong页面
    PubSub.subscribe('musicId', (msg, musicId) => {
      // 获取歌曲
      this.getMusicInfo(musicId);
      // 获得歌词
      this.getLyric(musicId);
      // 自动播放当前音乐
      this.musicControl(true, musicId);
      // 取消订阅
      PubSub.unsubscribe('musicId');
    })
    // 发布消息数据给recommendSong页面
    PubSub.publish('switchMusic', type);
  },

  // 获取歌词
  async getLyric(musicId) {
    let lyricData = await request("/lyric", {
      id: musicId
    });
    this.formatLyric(lyricData.lrc.lyric);
  },

  // 传入初始歌词文本text
  formatLyric(text) {
    let result = [];
    // 通过换行符“\n”进行切割歌词文本
    let arr = text.split("\n");
    // 获取歌词行数
    let row = arr.length;
    for (let i = 0; i < row; i++) {
      //在每一行格式大概就是这样"[00:04.302][02:10.00]hello world";
      let temp_row = arr[i];
      // 我们可以通过“]”对时间和文本进行分离
      let temp_arr = temp_row.split("]");
      // 把歌词文本从数组中剔除出来，获取到歌词文本了！
      let text = temp_arr.pop();
      // 再对剩下的歌词时间进行处理
      temp_arr.forEach(element => {
        let obj = {};
        // 先把多余的“[”去掉，再分离出分、秒
        let time_arr = element.substr(1, element.length - 1).split(":");
        // 把时间转换成与currentTime相同的类型，方便待会实现滚动效果
        let s = parseInt(time_arr[0]) * 60 + Math.ceil(time_arr[1]);
        obj.time = s;
        obj.text = text;
        // 每一行歌词对象存到组件的lyric歌词属性里
        result.push(obj);
      });
    }
    // 由于不同时间的相同歌词我们给排到一起了，所以这里要以时间顺序重新排列一下
    result.sort(this.sortRule)
    this.setData({
      lyric: result
    })
  },
  sortRule(a, b) {
    // 设置一下排序规则
    return a.time - b.time;
  },

  // 控制歌词播放
  getCurrentLyric() {
    let j;
    for (j = 0; j < this.data.lyric.length - 1; j++) {
      if (this.data.lyricTime == this.data.lyric[j].time) {
        this.setData({
          currentLyric: this.data.lyric[j].text
        })
      }
    }
  },
})