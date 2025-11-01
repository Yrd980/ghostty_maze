import type { Flashlight, Vector2 } from '../types/game.types';
import { FLASHLIGHT_CONFIG } from '../constants/game.constants';

export class FlashlightController {
  private flashlight: Flashlight;

  constructor() {
    this.flashlight = {
      isOn: false,
      angle: FLASHLIGHT_CONFIG.ANGLE,
      range: FLASHLIGHT_CONFIG.RANGE,
      brightness: FLASHLIGHT_CONFIG.BRIGHTNESS,
      battery: FLASHLIGHT_CONFIG.MAX_BATTERY,
      maxBattery: FLASHLIGHT_CONFIG.MAX_BATTERY,
      drainRate: FLASHLIGHT_CONFIG.DRAIN_RATE,
      shake: 0,
    };
  }

  /**
   * 切换手电筒开关
   */
  toggle(): void {
    // 只有有电时才能打开
    if (!this.flashlight.isOn && this.flashlight.battery <= 0) {
      return;
    }
    this.flashlight.isOn = !this.flashlight.isOn;
  }

  /**
   * 强制开启
   */
  turnOn(): void {
    if (this.flashlight.battery > 0) {
      this.flashlight.isOn = true;
    }
  }

  /**
   * 强制关闭
   */
  turnOff(): void {
    this.flashlight.isOn = false;
  }

  /**
   * 更新手电筒状态（每帧调用）
   */
  update(deltaTime: number, heartRate: number): void {
    // 消耗电池
    if (this.flashlight.isOn) {
      this.flashlight.battery = Math.max(
        0,
        this.flashlight.battery - this.flashlight.drainRate * deltaTime
      );

      // 电池耗尽自动关闭
      if (this.flashlight.battery <= 0) {
        this.flashlight.isOn = false;
      }
    }

    // 计算心率驱动的抖动
    this.updateShake(heartRate);
  }

  /**
   * 根据心率计算抖动效果
   */
  private updateShake(heartRate: number): void {
    if (heartRate < FLASHLIGHT_CONFIG.SHAKE_BPM_THRESHOLD) {
      this.flashlight.shake = 0;
      return;
    }

    // 心率越高，抖动越剧烈
    const normalized = Math.min(
      1,
      (heartRate - FLASHLIGHT_CONFIG.SHAKE_BPM_THRESHOLD) / 70
    );

    // 添加随机抖动
    const baseShake = normalized * FLASHLIGHT_CONFIG.SHAKE_MAX;
    this.flashlight.shake =
      baseShake * (0.5 + Math.random() * 0.5) * (Math.random() > 0.5 ? 1 : -1);
  }

  /**
   * 补充电池
   */
  rechargeBattery(amount: number): void {
    this.flashlight.battery = Math.min(
      this.flashlight.maxBattery,
      this.flashlight.battery + amount
    );
  }

  /**
   * 获取手电筒状态
   */
  getState(): Flashlight {
    return { ...this.flashlight };
  }

  /**
   * 获取电池百分比
   */
  getBatteryPercentage(): number {
    return (this.flashlight.battery / this.flashlight.maxBattery) * 100;
  }

  /**
   * 手电筒是否开启
   */
  isActive(): boolean {
    return this.flashlight.isOn;
  }

  /**
   * 获取包含抖动的实际照射方向
   */
  getShakeDirection(baseDirection: number): number {
    return baseDirection + (this.flashlight.shake * Math.PI) / 180;
  }
}
