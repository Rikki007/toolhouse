Здесь чистые данные без логики. Правки баланса — только числами.

skills.ts: у level с `branch` ровно 2 стороны, шаг factor между ними = 0.01
(напр. 1.10 / 1.11). Тёмные пути: dark, totalitarian.

Значение `unlocksImage` обязано существовать в skillLevelImages
(src/assets/assetLoader.ts), иначе иконка отрендерится пустой.

Новый уровень навыка: id уровня -> `<dept>-<n>`, ветка -> `<dept><Path>-<n>`.
