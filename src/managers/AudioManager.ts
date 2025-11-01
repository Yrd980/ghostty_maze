/**
 * 音频管理器 - 管理背景音乐和音效
 */
export class AudioManager {
  private bgm: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private baseVolume: number = 0.3;

  constructor() {
    // 初始化背景音乐
    this.initBGM();
  }

  /**
   * 初始化背景音乐
   */
  private initBGM(): void {
    try {
      this.bgm = new Audio('/src/assets/chase.mp3');
      this.bgm.loop = true;
      this.bgm.volume = this.baseVolume;
    } catch (error) {
      console.error('Failed to load BGM:', error);
    }
  }

  /**
   * 播放背景音乐
   */
  async playBGM(): Promise<void> {
    if (!this.bgm || this.isMuted) return;

    try {
      await this.bgm.play();
    } catch (error) {
      console.log('BGM autoplay blocked, waiting for user interaction');
    }
  }

  /**
   * 暂停背景音乐
   */
  pauseBGM(): void {
    if (this.bgm) {
      this.bgm.pause();
    }
  }

  /**
   * 停止背景音乐
   */
  stopBGM(): void {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
    }
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    this.baseVolume = Math.max(0, Math.min(1, volume));
    if (this.bgm) {
      this.bgm.volume = this.baseVolume;
    }
  }

  /**
   * 根据心率调整音量和播放速度
   */
  updateByHeartRate(heartRate: number): void {
    if (!this.bgm) return;

    // 心率越高，音量越大
    const heartRateMultiplier = Math.min(1.5, heartRate / 75);
    this.bgm.volume = this.baseVolume * heartRateMultiplier;

    // 心率越高，播放速度越快
    const playbackRate = Math.min(1.3, 0.8 + (heartRate - 60) / 100);
    this.bgm.playbackRate = Math.max(0.8, playbackRate);
  }

  /**
   * 根据理智值调整音效
   */
  updateBySanity(sanity: number): void {
    if (!this.bgm) return;

    // 理智越低，音乐越扭曲
    if (sanity < 30) {
      // 低理智时降低音质（通过音量波动模拟）
      const distortion = (30 - sanity) / 30;
      const volumeFluctuation = Math.sin(Date.now() / 200) * distortion * 0.2;
      this.bgm.volume = Math.max(0.1, this.baseVolume + volumeFluctuation);
    }
  }

  /**
   * 场景转换时的音效变化
   */
  onSceneTransition(sceneType: string): void {
    if (!this.bgm) return;

    // 根据场景类型调整音乐
    switch (sceneType) {
      case 'normal':
        this.setVolume(0.3);
        this.bgm.playbackRate = 1.0;
        break;
      case 'dark':
        this.setVolume(0.4);
        this.bgm.playbackRate = 0.9;
        break;
      case 'twisted':
        this.setVolume(0.35);
        this.bgm.playbackRate = 1.1;
        break;
      case 'crimson':
        this.setVolume(0.5);
        this.bgm.playbackRate = 1.2;
        break;
      case 'void':
        this.setVolume(0.25);
        this.bgm.playbackRate = 0.8;
        break;
    }
  }

  /**
   * 切换静音
   */
  toggleMute(): void {
    this.isMuted = !this.isMuted;
    if (this.bgm) {
      this.bgm.muted = this.isMuted;
    }
  }

  /**
   * 获取静音状态
   */
  isMutedState(): boolean {
    return this.isMuted;
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stopBGM();
    this.bgm = null;
  }
}
