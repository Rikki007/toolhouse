Единственный ключ localStorage — `toolhouse_app_state`.

Новое поле в GameState: добавить дефолт в `DEFAULT_*` и обработчик
старых сейвов (см. `migrateShopToIds` / `OLD_KEYS`). Не удалять и не
переименовывать ключи — игроки теряют прогресс.

Экран обязан вызывать cleanup для подписок `subscribe()`/`start*Observer`
и Pixi-контекста, иначе утечка при возврате в меню.
