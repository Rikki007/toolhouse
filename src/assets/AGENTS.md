There is no automatic file discovery (`import.meta.glob` is not used).

Adding an image = 3 steps: file into a subfolder -> `import x from './<dir>/x.png'`
in assetLoader.ts -> register it in the right map (skillImages / skillLevelImages /
interfaceIconImages / ...). Without the third step the image silently does not appear.

Sound is added the same way in src/state/audioManager.ts (soundFiles).
