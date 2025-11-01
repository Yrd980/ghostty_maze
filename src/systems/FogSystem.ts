import type { Player, Flashlight } from '../types/game.types';
import { FOG_CONFIG, SANITY_CONFIG } from '../constants/game.constants';

/**
 * 迷雾系统 - 控制全局暗度和视野限制
 */
export class FogSystem {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  /**
   * 渲染全局迷雾效果
   * 在手电筒外的区域应用暗度
   */
  renderFog(player: Player, flashlight?: Flashlight): void {
    const canvas = this.ctx.canvas;
    const { position } = player;

    // 保存当前状态
    this.ctx.save();

    // 创建全局暗度层
    this.ctx.fillStyle = `rgba(0, 0, 0, ${FOG_CONFIG.GLOBAL_DARKNESS})`;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 使用 destination-out 混合模式来"挖出"可见区域
    this.ctx.globalCompositeOperation = 'destination-out';

    // 如果手电筒开启，创建更大的可见区域
    if (flashlight && flashlight.isOn) {
      const visibleRadius = FOG_CONFIG.VISIBLE_RADIUS;
      const gradient = this.ctx.createRadialGradient(
        position.x,
        position.y,
        0,
        position.x,
        position.y,
        visibleRadius
      );

      // 中心完全透明（完全可见）
      gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
      // 中间区域逐渐变暗
      gradient.addColorStop(0.5, `rgba(0, 0, 0, ${FOG_CONFIG.EDGE_VISIBILITY})`);
      // 边缘完全黑暗
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(position.x, position.y, visibleRadius, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      // 手电筒关闭时，只有很小的可见范围
      const minRadius = FOG_CONFIG.MIN_VISIBLE_RADIUS;
      const gradient = this.ctx.createRadialGradient(
        position.x,
        position.y,
        0,
        position.x,
        position.y,
        minRadius
      );

      gradient.addColorStop(0, `rgba(0, 0, 0, ${FOG_CONFIG.NO_LIGHT_VISIBILITY})`);
      gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(position.x, position.y, minRadius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 恢复状态
    this.ctx.restore();
  }

  /**
   * 渲染暗角效果（Vignette）
   * 屏幕边缘变暗，增强聚焦感
   */
  renderVignette(intensity: number = FOG_CONFIG.VIGNETTE_INTENSITY): void {
    const canvas = this.ctx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

    this.ctx.save();

    // 创建径向渐变暗角
    const gradient = this.ctx.createRadialGradient(
      centerX,
      centerY,
      maxRadius * 0.3,
      centerX,
      centerY,
      maxRadius
    );

    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.ctx.restore();
  }

  /**
   * 根据心率调整迷雾效果
   * 心率越高，迷雾越浓重
   */
  renderHeartRateFog(heartRate: number): void {
    if (heartRate < FOG_CONFIG.HEARTRATE_FOG_THRESHOLD) {
      return;
    }

    // 计算心率影响强度
    const normalized = Math.min(
      1,
      (heartRate - FOG_CONFIG.HEARTRATE_FOG_THRESHOLD) / 50
    );

    const intensity = normalized * FOG_CONFIG.MAX_HEARTRATE_FOG;

    this.ctx.save();
    this.ctx.fillStyle = `rgba(0, 0, 0, ${intensity})`;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.restore();
  }

  /**
   * 根据理智值渲染视觉扭曲效果
   */
  renderSanityEffects(sanity: number): void {
    if (sanity >= SANITY_CONFIG.DISTORTION_START) {
      return;
    }

    const canvas = this.ctx.canvas;
    
    // 计算扭曲强度
    const distortionIntensity = 1 - (sanity / SANITY_CONFIG.DISTORTION_START);

    this.ctx.save();

    // 低理智：红色边缘
    if (sanity < SANITY_CONFIG.LOW_SANITY_THRESHOLD) {
      const redIntensity = 1 - (sanity / SANITY_CONFIG.LOW_SANITY_THRESHOLD);
      this.ctx.fillStyle = `rgba(255, 0, 0, ${redIntensity * 0.2})`;
      this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 极低理智：屏幕抖动效果（通过暗角模拟）
    if (sanity < SANITY_CONFIG.CRITICAL_SANITY_THRESHOLD) {
      const shake = Math.sin(Date.now() / 100) * 0.3;
      this.ctx.globalAlpha = 0.3 + shake * 0.2;
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 色差效果
    if (distortionIntensity > 0.3) {
      this.ctx.globalCompositeOperation = 'screen';
      this.ctx.globalAlpha = distortionIntensity * 0.1;
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(2, 0, canvas.width, canvas.height);
      this.ctx.fillStyle = '#00ff00';
      this.ctx.fillRect(-2, 0, canvas.width, canvas.height);
    }

    this.ctx.restore();
  }
}
