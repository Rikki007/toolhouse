Автоматического подхвата файлов нет (`import.meta.glob` не используется).

Добавить картинку = 3 шага: файл в подпапку -> `import x from './<dir>/x.png'`
в assetLoader.ts -> регистрация в нужный map (skillImages / skillLevelImages /
interfaceIconImages / ...). Без третьего шага изображение молча не появится.

Звук добавляется так же в src/state/audioManager.ts (soundFiles).
