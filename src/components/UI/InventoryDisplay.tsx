import type { Inventory } from '../../types/game.types';
import { ItemType } from '../../types/game.types';

interface InventoryDisplayProps {
  inventory: Inventory;
}

export function InventoryDisplay({ inventory }: InventoryDisplayProps) {
  const getItemIcon = (itemType: ItemType | null): string => {
    if (!itemType) return '';

    switch (itemType) {
      case ItemType.BATTERY:
        return '🔋';
      case ItemType.MEDKIT:
        return '💊';
      case ItemType.KEY:
        return '🔑';
      case ItemType.JAMMER:
        return '📻';
      default:
        return '?';
    }
  };

  const getItemColor = (itemType: ItemType | null): string => {
    if (!itemType) return '#333333';

    switch (itemType) {
      case ItemType.BATTERY:
        return '#4affff';
      case ItemType.MEDKIT:
        return '#ff4444';
      case ItemType.KEY:
        return '#ffff44';
      case ItemType.JAMMER:
        return '#ff44ff';
      default:
        return '#ffffff';
    }
  };

  return (
    <div className="bg-horror-dark bg-opacity-90 p-4 rounded horror-border">
      <div className="text-horror-red font-bold mb-2 text-sm">INVENTORY</div>
      <div className="flex gap-2">
        {inventory.slots.map((slot, index) => {
          const isEmpty = slot.item === null;
          const color = getItemColor(slot.item);

          return (
            <div
              key={index}
              className="w-16 h-16 bg-gray-900 rounded border-2 flex items-center justify-center relative transition-all"
              style={{
                borderColor: isEmpty ? '#333333' : color,
                boxShadow: isEmpty ? 'none' : `0 0 8px ${color}`,
              }}
            >
              {!isEmpty && (
                <>
                  {/* Item Icon */}
                  <div className="text-3xl">{getItemIcon(slot.item)}</div>

                  {/* Item Count */}
                  <div
                    className="absolute bottom-1 right-1 text-xs font-bold px-1 rounded"
                    style={{
                      color: color,
                      textShadow: `0 0 4px ${color}`,
                    }}
                  >
                    x{slot.count}
                  </div>
                </>
              )}

              {/* Empty slot indicator */}
              {isEmpty && (
                <div className="text-gray-600 text-2xl">-</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
