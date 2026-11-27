The only localStorage key is `toolhouse_app_state`.

New GameState field: add a default in `DEFAULT_*` and a handler for
old saves (see `migrateShopToIds` / `OLD_KEYS`). Never delete or
rename keys — players lose progress.

A screen must call cleanup for `subscribe()`/`start*Observer` subscriptions
and for the Pixi context, otherwise it leaks when returning to the menu.
