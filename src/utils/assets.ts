import { reachTruckImages, orderPickerImages, richDriversImages, pickerImages, riggingImages } from '../assets/assetLoader.ts'

/**
 * Получает URL изображения по ключу.
 * Ищет в словарях: ричтраки → ордерпикеры → водители → сборщики → снаряжение.
 */
export function getEquipmentImage(key: string): string {
  return reachTruckImages[key] || orderPickerImages[key] || richDriversImages[key] || pickerImages[key] || riggingImages[key] || ''
}

/**
 * Получает URL изображения снаряжения по ключу.
 */
export function getRiggingImage(key: string): string {
  return riggingImages[key] || ''
}
