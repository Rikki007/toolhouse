/**
 * Предзагружает изображения в браузер.
 * Вызывает decode() для каждого URL, чтобы они попали в кэш.
 */
export function preloadImages(urls: string[]): void {
  urls.forEach(url => {
    const img = new Image()
    img.src = url
    img.decode().catch(() => {})
  })
}
