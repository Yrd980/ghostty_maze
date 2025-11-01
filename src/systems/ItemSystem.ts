import type { Item, ItemType, Maze, Vector2 } from '../types/game.types';
import { ITEM_CONFIG, MAZE_CONFIG } from '../constants/game.constants';
import { ItemType as ItemTypeEnum } from '../types/game.types';

export class ItemSystem {
  private items: Item[] = [];
  private idCounter = 0;

  /**
   * 在迷宫中生成道具
   */
  generateItems(maze: Maze): Item[] {
    this.items = [];
    this.idCounter = 0;

    // 生成电池
    for (let i = 0; i < ITEM_CONFIG.BATTERY_COUNT; i++) {
      this.spawnItem(ItemTypeEnum.BATTERY, maze);
    }

    // 生成医疗包
    for (let i = 0; i < ITEM_CONFIG.MEDKIT_COUNT; i++) {
      this.spawnItem(ItemTypeEnum.MEDKIT, maze);
    }

    // 生成收藏品/物种
    const speciesTypes = [
      ItemTypeEnum.ANCIENT_COIN,
      ItemTypeEnum.CRYSTAL,
      ItemTypeEnum.SKULL,
      ItemTypeEnum.BOOK,
      ItemTypeEnum.POTION,
      ItemTypeEnum.ARTIFACT,
      ItemTypeEnum.MUSHROOM,
      ItemTypeEnum.FEATHER,
      ItemTypeEnum.STONE,
      ItemTypeEnum.FLOWER,
      ItemTypeEnum.EYE,
      ItemTypeEnum.TOOTH,
    ];

    for (let i = 0; i < ITEM_CONFIG.SPECIES_COUNT; i++) {
      const randomType = speciesTypes[Math.floor(Math.random() * speciesTypes.length)];
      this.spawnItem(randomType, maze);
    }

    return this.items;
  }

  /**
   * 在迷宫随机位置生成道具
   */
  spawnItem(type: ItemType, maze: Maze, isFake: boolean = false): void {
    const position = this.getRandomValidPosition(maze);

    const item: Item = {
      id: `item-${this.idCounter++}`,
      type,
      position,
      isCollected: false,
      isFake,
    };

    this.items.push(item);
  }

  /**
   * 根据运气值生成道具（可能是假的）
   */
  generateItemWithLuck(type: ItemType, maze: Maze, luck: number): void {
    // 运气越低，越容易生成假道具
    const fakeChance = Math.max(0, (100 - luck) / 100 * 0.3); // 最高30%假道具率
    const isFake = Math.random() < fakeChance;
    this.spawnItem(type, maze, isFake);
  }

  /**
   * 获取随机有效位置（避开起点和终点）
   */
  private getRandomValidPosition(maze: Maze): Vector2 {
    const cellSize = maze.cellSize;
    const margin = cellSize / 2;

    // 避开起点和终点的区域
    const avoidCells = [
      { x: 0, y: 0 },                              // 起点
      { x: maze.width - 1, y: maze.height - 1 },   // 终点
    ];

    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const cellX = Math.floor(Math.random() * maze.width);
      const cellY = Math.floor(Math.random() * maze.height);

      // 检查是否在避开区域
      const isAvoid = avoidCells.some(
        (cell) => Math.abs(cell.x - cellX) <= 1 && Math.abs(cell.y - cellY) <= 1
      );

      if (!isAvoid) {
        return {
          x: cellX * cellSize + margin,
          y: cellY * cellSize + margin,
        };
      }

      attempts++;
    }

    // 如果尝试太多次，返回中心位置
    return {
      x: (maze.width / 2) * cellSize + margin,
      y: (maze.height / 2) * cellSize + margin,
    };
  }

  /**
   * 检测玩家是否拾取道具
   */
  checkPickup(playerPos: Vector2): Item | null {
    for (const item of this.items) {
      if (item.isCollected) continue;

      const distance = Math.sqrt(
        Math.pow(item.position.x - playerPos.x, 2) +
        Math.pow(item.position.y - playerPos.y, 2)
      );

      if (distance < ITEM_CONFIG.PICKUP_RADIUS) {
        item.isCollected = true;
        return item;
      }
    }

    return null;
  }

  /**
   * 获取所有道具
   */
  getItems(): Item[] {
    return this.items;
  }

  /**
   * 获取未拾取的道具
   */
  getUncollectedItems(): Item[] {
    return this.items.filter((item) => !item.isCollected);
  }

  /**
   * 获取已拾取的道具数量
   */
  getCollectedCount(type?: ItemType): number {
    if (type) {
      return this.items.filter((item) => item.type === type && item.isCollected).length;
    }
    return this.items.filter((item) => item.isCollected).length;
  }
}
