# Changelog

## [0.2.0](https://github.com/Wixonic/Mercury/compare/v0.1.1...v0.2.0) (2026-08-09)


### Features

* Allow DevTools cause why not? ([c2ce1b9](https://github.com/Wixonic/Mercury/commit/c2ce1b909b128ac3ad8a5c597fb7ca71bf4531a7))
* **API:** Add `Message`, `GuildMember`, `Permission` structures and improve `Channel`, `Guild`, `Emoji`, `Sticker` and `User` related structure property/method names ([fdc1faa](https://github.com/Wixonic/Mercury/commit/fdc1faa0aac5ee8edabc3b2b21986203680243d3))
* **API:** Add caching for `Guild.listChannels` ([c87b313](https://github.com/Wixonic/Mercury/commit/c87b313e5880ba31fd028a303ea3b104f928a81d))
* **API:** Add Guild channels manager and a way to get channels from a guild ([8ab522a](https://github.com/Wixonic/Mercury/commit/8ab522a4ad1381b5b9aa82e1f6348e424f31cf7f))
* **API:** Implement Channel and ChannelCollection classes ([4adc9ec](https://github.com/Wixonic/Mercury/commit/4adc9ec88aaf91cad1609f2e12645f6bcff32e05))
* **API:** Implement Channel category, which helps reproducing some of the official client's behavior ([f79da3d](https://github.com/Wixonic/Mercury/commit/f79da3dae86c5f7d14a32bd8ec2f9f7802c7e263))
* **API:** improve loading speed by using already-fetched data from `Gateway`'s `Ready` event ([898f12a](https://github.com/Wixonic/Mercury/commit/898f12aa1e496275109d88256619c649733e6797))
* **API:** Migrate structures to more complex types. This include type migration like `GuildMember` instead of `Snowflake` to allow for patches when data is provided, and basic migration like `Date` instead of `Number` ([fdc1faa](https://github.com/Wixonic/Mercury/commit/fdc1faa0aac5ee8edabc3b2b21986203680243d3))
* **Channel:** Add initial structure for channels ([906604a](https://github.com/Wixonic/Mercury/commit/906604a52952c2f8f3215cae8503b084192e157a))
* **Collection:** Add `.patch()` which allows updating with `Partial` structures ([fdc1faa](https://github.com/Wixonic/Mercury/commit/fdc1faa0aac5ee8edabc3b2b21986203680243d3))
* Discord styles ([80ddf95](https://github.com/Wixonic/Mercury/commit/80ddf952d5f474e062564f90f8b9e5a63ed187be))
* DM channels, basic channel content, can send messages, channel icons, put uncategorized channels on top, and more ([68ac12b](https://github.com/Wixonic/Mercury/commit/68ac12bfbe8f055fbdd8cd7e8029e495497e17cb))
* Folders ([5327a0c](https://github.com/Wixonic/Mercury/commit/5327a0cd459245565554e99be1e107f04a6b8473))
* **Guilds:** Initial channel logic ([154d8fd](https://github.com/Wixonic/Mercury/commit/154d8fde18aaf21c8e28f9c45faa199f5eb85112))
* **Icons:** improve loading speed by downloading icons in parallel ([898f12a](https://github.com/Wixonic/Mercury/commit/898f12aa1e496275109d88256619c649733e6797))
* **Icons:** Use existing Collection structure for icons to improve loading performance ([8d5af43](https://github.com/Wixonic/Mercury/commit/8d5af43a2d14806d0c9b96d2fbdb85ff0bfacdc4))
* Improve roles ([e6c9269](https://github.com/Wixonic/Mercury/commit/e6c92694d1ad24729777e5b569e1b9a6bfbd10fd))
* Initial channel structure fetching ([88b4768](https://github.com/Wixonic/Mercury/commit/88b4768088550cca4ee356a1b6e950bb3cb692e0))
* **Internal:** add a way to retrieve cached elements from collections ([73cba0c](https://github.com/Wixonic/Mercury/commit/73cba0c1bb7b6049487d424d0cd1c9f92e617c4f))
* **JSON:** Add BigInt support ([5af1de2](https://github.com/Wixonic/Mercury/commit/5af1de2823b5b17ebfb84a24a1a93eceb02fb9fd))
* New icons (thanks phosphoricons) ([45db585](https://github.com/Wixonic/Mercury/commit/45db5853d220633bd756fc141c0cbbabd6c0d8af))
* **Presence:** Add initial presence template, only for development ([59aa264](https://github.com/Wixonic/Mercury/commit/59aa264d24ae7f7284dc8d238c7abe40c5d69198))
* Role and user components ([51db725](https://github.com/Wixonic/Mercury/commit/51db725f49ab7fca5088ddb1b32001c7eaa67fc5))
* **Settings:** Improve and minify code, add Channel and Guild specific settings ([58dd9be](https://github.com/Wixonic/Mercury/commit/58dd9bea2ad059321dd477e2d91a77a56160bd8d))
* **Style:** Harmonize `<main>` border size ([a5a869a](https://github.com/Wixonic/Mercury/commit/a5a869aa0cdac7a146dfa15e7bb4928039f68629))
* **Style:** Initial channel lists design ([fef8966](https://github.com/Wixonic/Mercury/commit/fef8966fd473bc21c90ee2d7a9fb8a61c113c43e))
* **Style:** Update icons to `fill`-ed variants and improve loading time ([d5a09bc](https://github.com/Wixonic/Mercury/commit/d5a09bca2f8018e0791ca4b4509b720c1e25ed21))
* **Style:** Use `overscroll-behavior: contain` by default ([9437bcc](https://github.com/Wixonic/Mercury/commit/9437bcc3bec2c93d09f36b61466b67e2332af6b9))
* Tried to improve YouBar ([f733e1a](https://github.com/Wixonic/Mercury/commit/f733e1ac4a515ebe194b23bc29b92a1f02843540))
* **Typings:** Change Loaded to Partial (thus inverting all booleans related to partial objects) to match documentation ([157c14c](https://github.com/Wixonic/Mercury/commit/157c14c51e4adbe01f63ea895515c09657b6bee1))
* **View:** Enhance view loading performance ([55a3609](https://github.com/Wixonic/Mercury/commit/55a36094571f030ba278b6533bcfd91d32a6195a))
* **View:** Minified `view()` to the bare bones ([22da847](https://github.com/Wixonic/Mercury/commit/22da847c80fd6cd86edbaea67b4b092909d6f8ec))
* **Views:** views now supports URLSearchParams ([b400d01](https://github.com/Wixonic/Mercury/commit/b400d01d638d41c03aaccdccf6827396f47f7f7f))


### Bug Fixes

* **App:** Rename handlers using the wrong event type ([254dc4b](https://github.com/Wixonic/Mercury/commit/254dc4b28a437f004cc1d18a899c3f59b94e2ea4))
* Avoid crash ([1060eaa](https://github.com/Wixonic/Mercury/commit/1060eaad00815fa01b24574f63a56c358956e8e4))
* **Channel:** Provide parent ([1bc97d2](https://github.com/Wixonic/Mercury/commit/1bc97d2389496e96ea371934c436b502676fb119))
* **Gateway:** Add logs when failed to disconnect, wait for full deconnection before reconnecting ([c87b313](https://github.com/Wixonic/Mercury/commit/c87b313e5880ba31fd028a303ea3b104f928a81d))
* **Gateway:** removing `LazyUserNotes` intent ([c87b313](https://github.com/Wixonic/Mercury/commit/c87b313e5880ba31fd028a303ea3b104f928a81d))
* **Settings:** Add checks and fetching if needed ([a15c2ce](https://github.com/Wixonic/Mercury/commit/a15c2ce26db596a154463011b5f021db870cbd32))
* **Style:** Fix tooltip positioning issues on window scroll ([cde9e46](https://github.com/Wixonic/Mercury/commit/cde9e463a4a33c5089d83a1928800a60d9c03594))
* **Style:** Loading animation only need to be applied to the direct childs ([6371c98](https://github.com/Wixonic/Mercury/commit/6371c9863d973b166959125da8736ad62cfadf65))
* Update App icons to the `.png` colorful icon generated from `icon.icon` instead of the flat monochrome `.svg` icon ([273d6d0](https://github.com/Wixonic/Mercury/commit/273d6d09121deb7c6563a06f0b77117c0b805621))
* **View:** Handle fast changes ([55a3609](https://github.com/Wixonic/Mercury/commit/55a36094571f030ba278b6533bcfd91d32a6195a))

## [0.1.1](https://github.com/Wixonic/Mercury/compare/v0.1.0...v0.1.1) (2026-06-29)


### Bug Fixes

* Well apparently I fucked up a few days ago ([db5e6ab](https://github.com/Wixonic/Mercury/commit/db5e6ab8ad04b16400047c65925f3a5e928f4078))

## 0.1.0 - Initial Release (2026-06-29)

Initial Release
