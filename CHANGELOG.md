# Changelog

## 1.0.0 (2026-06-13)


### Features

* add Bluetooth thermal receipt printing with ESC/POS support ([4524f80](https://github.com/WashTrackph/washtrack-cloud/commit/4524f80c4e32a405959d97705cd2552f4387fdf3))
* add Delivery stage to workflow and address field for customers ([0c7c0bc](https://github.com/WashTrackph/washtrack-cloud/commit/0c7c0bc6f07976c35d7ce8c36237db05607e39fc))
* add delivery stage, collapsible board columns, customer editing, inventory management ([188421a](https://github.com/WashTrackph/washtrack-cloud/commit/188421ada45239d3a635c341565e05c62304ffb7))
* add drag-and-drop to kanban board ([c8021b0](https://github.com/WashTrackph/washtrack-cloud/commit/c8021b035d6b7f32f0c7c5c3dd26cd5f129cfaab))
* add edit supply functionality with Owner PIN protection ([92c419f](https://github.com/WashTrackph/washtrack-cloud/commit/92c419f93dba9cc6fbca96f02980f941a6e27c3d))
* add email report scheduler module ([23b21ae](https://github.com/WashTrackph/washtrack-cloud/commit/23b21aed689f7da514a1268d679fad45ad461f0e))
* add end-of-shift email trigger on logout ([0d44324](https://github.com/WashTrackph/washtrack-cloud/commit/0d44324c1a5b2c91f83900f7e9718ef3ab498c51))
* add Facebook link field + {facebook} SMS token + friendlier default templates ([30b09b0](https://github.com/WashTrackph/washtrack-cloud/commit/30b09b0f064260ec410aef97ced7901380b2882f))
* add GitHub Actions CI/CD with signed Android APK releases ([ed32ad8](https://github.com/WashTrackph/washtrack-cloud/commit/ed32ad828d808367cc1dc9f5226edc64d4980028))
* add GitHub Actions CI/CD with signed Android APK releases ([15cd1b7](https://github.com/WashTrackph/washtrack-cloud/commit/15cd1b7de6f79e66ee7b845adea278fc6d536720))
* add license system (trial + key-based, monthly/3m/6m/yearly) ([31e6e8d](https://github.com/WashTrackph/washtrack-cloud/commit/31e6e8d2fa823c9a898dce0450b141c4c7c8f1ff))
* add manual Email Report button to ReportsScreen ([bc1d808](https://github.com/WashTrackph/washtrack-cloud/commit/bc1d808f3f4a2d9363f9d43f41fd3d5c352c46f4))
* add new supply button and form to inventory screen ([15e10d9](https://github.com/WashTrackph/washtrack-cloud/commit/15e10d95694ae0ff926cca3a3981d55874ae719c))
* add pay-later flow for orders with deferred payment collection ([abd5d75](https://github.com/WashTrackph/washtrack-cloud/commit/abd5d75bb44a8021bd828a1dff43d8208d6945ec))
* add Promo Blast SMS campaign system ([2c7958f](https://github.com/WashTrackph/washtrack-cloud/commit/2c7958f1094d0578a4db261ae7d62504238ec5ce))
* add release-please, Windows build, and fix project metadata ([1344fc5](https://github.com/WashTrackph/washtrack-cloud/commit/1344fc5eea80041c75c29ee6f88b8500a8ad58dd))
* add release-please, Windows build, and fix project metadata ([c0312c8](https://github.com/WashTrackph/washtrack-cloud/commit/c0312c85dbc677c65b0b3e5fe9431687fe7c648e))
* add search to orders screen ([b47367f](https://github.com/WashTrackph/washtrack-cloud/commit/b47367f8cce9ba784dcb9f0a17f95e5612330897))
* add semaphore-sms crate for Philippine SMS gateway integration ([8b95c26](https://github.com/WashTrackph/washtrack-cloud/commit/8b95c26e5be266d46e57490786d26c7de94893ef))
* add SMS gateway config UI and report builder utilities ([b7a7fe2](https://github.com/WashTrackph/washtrack-cloud/commit/b7a7fe2d5ead5d0a4469b7209d945a002baf98ab))
* add SMS mock mode for simulating messages without sending ([fe9b269](https://github.com/WashTrackph/washtrack-cloud/commit/fe9b2696c880c752aa9a7c4e88ceaf70b6cda195))
* add SMTP email support with provider presets and test verification ([e41bc3a](https://github.com/WashTrackph/washtrack-cloud/commit/e41bc3aa062f9014d91f49afb7594d426a5bb1df))
* add Supabase cloud sync and auth ([8db5812](https://github.com/WashTrackph/washtrack-cloud/commit/8db581219041e84677da8e469f5fea6521345acf))
* add tauri-plugin-printer for Android native receipt printing ([890a655](https://github.com/WashTrackph/washtrack-cloud/commit/890a655f7a7cbc42a94a2f7c1485f87258792afc))
* add total customers count to email report ([ea1ab68](https://github.com/WashTrackph/washtrack-cloud/commit/ea1ab68933297186513906632b3578e4158166cb))
* add WashTrack key generator tool with customer tracker and Excel export ([01f8c05](https://github.com/WashTrackph/washtrack-cloud/commit/01f8c05acfe9ab3d33887e9b873f1ff5389c5fd3))
* allow multiple quantities for flat rate and fixed load services ([cfba524](https://github.com/WashTrackph/washtrack-cloud/commit/cfba52496b4590ebf41b8c8f0b3f97058f56c708))
* background SMS status checks with toast notifications ([b145bde](https://github.com/WashTrackph/washtrack-cloud/commit/b145bde2b167d7c6eab84a81603392bb04a0c3e3))
* backup & restore — export/import all data as JSON ([617f50b](https://github.com/WashTrackph/washtrack-cloud/commit/617f50b0a768270dc2f5af2359d9341671d629b2))
* dedicated Settings PIN separate from Owner PIN ([c8b0502](https://github.com/WashTrackph/washtrack-cloud/commit/c8b050217303bd85b8c004f78c436ec414a22b50))
* integrate email scheduler into AppContext with 5-min interval ([b1a5a00](https://github.com/WashTrackph/washtrack-cloud/commit/b1a5a00bb4faba7a91221835c4ceb71826f497d0))
* License tab in Settings — always visible status, days left, key entry ([02981e2](https://github.com/WashTrackph/washtrack-cloud/commit/02981e2438ccc1e9b0dcfe36fb6beef007b2ba6a))
* modular Tauri v2 POS app with SQLite, theming, and offline fonts ([9f5e692](https://github.com/WashTrackph/washtrack-cloud/commit/9f5e69285b54a4b916df9e725887e8e2274772a3))
* periodic email reports every N hours during work hours ([7790732](https://github.com/WashTrackph/washtrack-cloud/commit/779073230317c983e135a87035acb7800b212d1a))
* remove trial system, fix types, update build config to v2.0.0 ([105d8de](https://github.com/WashTrackph/washtrack-cloud/commit/105d8ded72188c77a8de393fa6e3609a7571aa8b))
* require owner PIN to access Settings ([5d96ae1](https://github.com/WashTrackph/washtrack-cloud/commit/5d96ae10546d68675089b89d1ce6f9ff33483e00))
* service quantity multiplier, SMS integration & security hardening ([08b2737](https://github.com/WashTrackph/washtrack-cloud/commit/08b273769904c51e2281b619cdaad1e092c3453e))
* service quantity, SMS, security hardening & UX fixes ([0cbda6d](https://github.com/WashTrackph/washtrack-cloud/commit/0cbda6d9750ed379f4619826e30505c1724196ce))
* wire up SMS sending to Semaphore API via Tauri backend ([bc6029a](https://github.com/WashTrackph/washtrack-cloud/commit/bc6029a20fe846fd58200fd3dcf70c058d2ac540))


### Bug Fixes

* add customer deletion with cascading order and SMS log removal ([902efd1](https://github.com/WashTrackph/washtrack-cloud/commit/902efd14e2f8bd598479d347d153894ecbc44655))
* add missing delivery SMS template to seeds ([48abb7e](https://github.com/WashTrackph/washtrack-cloud/commit/48abb7e41056bfc80f73ad1efc45cc6c03e577d2))
* block app without license key — remove trial from isLicenseAllowed ([d276038](https://github.com/WashTrackph/washtrack-cloud/commit/d27603803b7f929a0c606cee093bfb2f098b24e3))
* bump tauri-plugin-sql to 2.4.0 in both Cargo.toml and package.json to fix version mismatch ([2e9bf05](https://github.com/WashTrackph/washtrack-cloud/commit/2e9bf05ed28e06f81a3183b4c7021e8bca2d9840))
* check staff array for MANAGER role PIN instead of non-existent shop.managerPin ([a8333a5](https://github.com/WashTrackph/washtrack-cloud/commit/a8333a5e1cf1efcd200f83445578744399bc70be))
* enable Windows build on workflow_dispatch trigger ([06af778](https://github.com/WashTrackph/washtrack-cloud/commit/06af778792dd771c43fa6f66f76d9eeb6b38b725))
* end-of-shift email is now time-based, not logout-triggered ([81588ec](https://github.com/WashTrackph/washtrack-cloud/commit/81588ec9ce9ff0f907ffa11b45afaaa14b000c0b))
* make customer phone number optional ([d8442c9](https://github.com/WashTrackph/washtrack-cloud/commit/d8442c9f69aa9442f42114aac95b3a99fc941b64))
* migrate delivery stage for existing installs, add customer edit (name/phone/address) ([a373392](https://github.com/WashTrackph/washtrack-cloud/commit/a373392f793b648ed621e4fed0c0a04026092528))
* mobile vite config and AppContext sync improvements ([8ca6324](https://github.com/WashTrackph/washtrack-cloud/commit/8ca632461dc95319a80bf92125a6646027aab9f0))
* order search placeholder unicode escape showing as raw text ([0646e15](https://github.com/WashTrackph/washtrack-cloud/commit/0646e1550926abee1b6a7b2dc10ae2fa78a05c3d))
* pass shop to getOverstay on HomeScreen, remove orphaned reportEmail field ([36e7b53](https://github.com/WashTrackph/washtrack-cloud/commit/36e7b53d9040027f700da8470c0c03b69c70481a))
* POS new customer flow, unpaid order UX, and placeholder rendering ([4292c88](https://github.com/WashTrackph/washtrack-cloud/commit/4292c88f1bbd9e54e1160e44a4e707d914f1d24b))
* prevent duplicate Ready SMS when order moves back and forward ([4825f04](https://github.com/WashTrackph/washtrack-cloud/commit/4825f049bea3e48c90cf82b185e12d85b14bc52d))
* remove all Philippine-specific placeholder text, use generic English ([24851cc](https://github.com/WashTrackph/washtrack-cloud/commit/24851ccd60ced82d9895ca78d664c7095831bf0a))
* remove PIN gate from payment collection (staff-level action) ([d284adb](https://github.com/WashTrackph/washtrack-cloud/commit/d284adb403046b2bf0935d75c91d1f38aef517ac))
* rename APK output variable to avoid PATH shadowing ([29fd1ff](https://github.com/WashTrackph/washtrack-cloud/commit/29fd1ffbfd82a5c1ae74fd7b0ea67b64d71c3c18))
* replace all broken unicode surrogate escape sequences with actual emoji characters ([446fd79](https://github.com/WashTrackph/washtrack-cloud/commit/446fd79af1b9e2b4b2591ee955532fe9892d657e))
* replace broken unicode search icon with plain character ([211aace](https://github.com/WashTrackph/washtrack-cloud/commit/211aace4a7385397e1239139fea158b05700ace9))
* replace HTML5 drag-and-drop with pointer events for kanban ([e8b9b23](https://github.com/WashTrackph/washtrack-cloud/commit/e8b9b23af80b66623f0b518ec81b6eb4e4c6a5f8))
* replace tauri-action with direct npx tauri build for Windows ([426e200](https://github.com/WashTrackph/washtrack-cloud/commit/426e200658bffdb5facd1885655a5ee71b1e6e7e))
* require Owner PIN to add new supply ([eac91e7](https://github.com/WashTrackph/washtrack-cloud/commit/eac91e7452e2057f6f9cad27f2c74db67d086a81))
* security hardening and verification fixes ([5876017](https://github.com/WashTrackph/washtrack-cloud/commit/5876017c1d64800726828d6bd312313569f0f349))
* set all seed inventory quantities to 0 for fresh installs ([3596f16](https://github.com/WashTrackph/washtrack-cloud/commit/3596f1623d4891527d336058434ba9a1c021efcf))
* show all stages on board (was sliced to 5, hiding delivery and picked up) ([9126420](https://github.com/WashTrackph/washtrack-cloud/commit/9126420c09b83635fd94815ff1e28ab0ac52b384))
* switch SMS default templates to English ([b7f43c5](https://github.com/WashTrackph/washtrack-cloud/commit/b7f43c53f66fe00352b9d8640ddcba62b37f1fad))
* update Cargo.lock to reflect tauri-plugin-sql 2.4.0 ([59a33aa](https://github.com/WashTrackph/washtrack-cloud/commit/59a33aab1a62cf167b0448ac01d9a8b73ba5c385))
* use npm instead of bun for Windows build in tauri-action ([09b28d8](https://github.com/WashTrackph/washtrack-cloud/commit/09b28d812169c41738ba2bc7238084498cfee4f2))
* wire up disconnected features and remove dead code ([33ba679](https://github.com/WashTrackph/washtrack-cloud/commit/33ba679324056dd079ae0b6a84b53b5dc8bd0cbc))
* wire up disconnected features and remove dead code ([4c0c2eb](https://github.com/WashTrackph/washtrack-cloud/commit/4c0c2eb03da620890ccb858dc55b98bbe8d7168c))
* wrap search icon in JSX expression so it renders correctly ([df52509](https://github.com/WashTrackph/washtrack-cloud/commit/df525094fba934980ebcc1b7cc3d7cb8a0b67cf6))


### Reverts

* restore original seed PINs for mock/demo data ([310d786](https://github.com/WashTrackph/washtrack-cloud/commit/310d786357ee96a3ab1be474637a4701e9cc5c06))

## [2.1.1](https://github.com/WashTrackph/Washtrack-2.0/compare/v2.1.0...v2.1.1) (2026-06-12)


### Bug Fixes

* add missing delivery SMS template to seeds ([48abb7e](https://github.com/WashTrackph/Washtrack-2.0/commit/48abb7e41056bfc80f73ad1efc45cc6c03e577d2))

## [2.1.0](https://github.com/WashTrackph/Washtrack-2.0/compare/v2.0.0...v2.1.0) (2026-06-12)


### Features

* add Delivery stage to workflow and address field for customers ([0c7c0bc](https://github.com/WashTrackph/Washtrack-2.0/commit/0c7c0bc6f07976c35d7ce8c36237db05607e39fc))
* add delivery stage, collapsible board columns, customer editing, inventory management ([188421a](https://github.com/WashTrackph/Washtrack-2.0/commit/188421ada45239d3a635c341565e05c62304ffb7))
* add edit supply functionality with Owner PIN protection ([92c419f](https://github.com/WashTrackph/Washtrack-2.0/commit/92c419f93dba9cc6fbca96f02980f941a6e27c3d))
* add Facebook link field + {facebook} SMS token + friendlier default templates ([30b09b0](https://github.com/WashTrackph/Washtrack-2.0/commit/30b09b0f064260ec410aef97ced7901380b2882f))
* add new supply button and form to inventory screen ([15e10d9](https://github.com/WashTrackph/Washtrack-2.0/commit/15e10d95694ae0ff926cca3a3981d55874ae719c))
* add WashTrack key generator tool with customer tracker and Excel export ([01f8c05](https://github.com/WashTrackph/Washtrack-2.0/commit/01f8c05acfe9ab3d33887e9b873f1ff5389c5fd3))


### Bug Fixes

* block app without license key — remove trial from isLicenseAllowed ([d276038](https://github.com/WashTrackph/Washtrack-2.0/commit/d27603803b7f929a0c606cee093bfb2f098b24e3))
* bump tauri-plugin-sql to 2.4.0 in both Cargo.toml and package.json to fix version mismatch ([2e9bf05](https://github.com/WashTrackph/Washtrack-2.0/commit/2e9bf05ed28e06f81a3183b4c7021e8bca2d9840))
* check staff array for MANAGER role PIN instead of non-existent shop.managerPin ([a8333a5](https://github.com/WashTrackph/Washtrack-2.0/commit/a8333a5e1cf1efcd200f83445578744399bc70be))
* enable Windows build on workflow_dispatch trigger ([06af778](https://github.com/WashTrackph/Washtrack-2.0/commit/06af778792dd771c43fa6f66f76d9eeb6b38b725))
* migrate delivery stage for existing installs, add customer edit (name/phone/address) ([a373392](https://github.com/WashTrackph/Washtrack-2.0/commit/a373392f793b648ed621e4fed0c0a04026092528))
* order search placeholder unicode escape showing as raw text ([0646e15](https://github.com/WashTrackph/Washtrack-2.0/commit/0646e1550926abee1b6a7b2dc10ae2fa78a05c3d))
* remove all Philippine-specific placeholder text, use generic English ([24851cc](https://github.com/WashTrackph/Washtrack-2.0/commit/24851ccd60ced82d9895ca78d664c7095831bf0a))
* replace all broken unicode surrogate escape sequences with actual emoji characters ([446fd79](https://github.com/WashTrackph/Washtrack-2.0/commit/446fd79af1b9e2b4b2591ee955532fe9892d657e))
* replace broken unicode search icon with plain character ([211aace](https://github.com/WashTrackph/Washtrack-2.0/commit/211aace4a7385397e1239139fea158b05700ace9))
* replace tauri-action with direct npx tauri build for Windows ([426e200](https://github.com/WashTrackph/Washtrack-2.0/commit/426e200658bffdb5facd1885655a5ee71b1e6e7e))
* require Owner PIN to add new supply ([eac91e7](https://github.com/WashTrackph/Washtrack-2.0/commit/eac91e7452e2057f6f9cad27f2c74db67d086a81))
* set all seed inventory quantities to 0 for fresh installs ([3596f16](https://github.com/WashTrackph/Washtrack-2.0/commit/3596f1623d4891527d336058434ba9a1c021efcf))
* show all stages on board (was sliced to 5, hiding delivery and picked up) ([9126420](https://github.com/WashTrackph/Washtrack-2.0/commit/9126420c09b83635fd94815ff1e28ab0ac52b384))
* switch SMS default templates to English ([b7f43c5](https://github.com/WashTrackph/Washtrack-2.0/commit/b7f43c53f66fe00352b9d8640ddcba62b37f1fad))
* update Cargo.lock to reflect tauri-plugin-sql 2.4.0 ([59a33aa](https://github.com/WashTrackph/Washtrack-2.0/commit/59a33aab1a62cf167b0448ac01d9a8b73ba5c385))
* use npm instead of bun for Windows build in tauri-action ([09b28d8](https://github.com/WashTrackph/Washtrack-2.0/commit/09b28d812169c41738ba2bc7238084498cfee4f2))
* wrap search icon in JSX expression so it renders correctly ([df52509](https://github.com/WashTrackph/Washtrack-2.0/commit/df525094fba934980ebcc1b7cc3d7cb8a0b67cf6))

## [1.3.1-rc.1](https://github.com/WashTrackph/Washtrack/compare/v1.3.0-rc.1...v1.3.1-rc.1) (2026-03-14)


### Bug Fixes

* pass shop to getOverstay on HomeScreen, remove orphaned reportEmail field ([36e7b53](https://github.com/WashTrackph/Washtrack/commit/36e7b53d9040027f700da8470c0c03b69c70481a))
* wire up disconnected features and remove dead code ([33ba679](https://github.com/WashTrackph/Washtrack/commit/33ba679324056dd079ae0b6a84b53b5dc8bd0cbc))
* wire up disconnected features and remove dead code ([4c0c2eb](https://github.com/WashTrackph/Washtrack/commit/4c0c2eb03da620890ccb858dc55b98bbe8d7168c))

## [1.3.0-rc.1](https://github.com/WashTrackph/Washtrack/compare/v1.2.0-rc.1...v1.3.0-rc.1) (2026-03-14)


### Features

* add email report scheduler module ([23b21ae](https://github.com/WashTrackph/Washtrack/commit/23b21aed689f7da514a1268d679fad45ad461f0e))
* add end-of-shift email trigger on logout ([0d44324](https://github.com/WashTrackph/Washtrack/commit/0d44324c1a5b2c91f83900f7e9718ef3ab498c51))
* add manual Email Report button to ReportsScreen ([bc1d808](https://github.com/WashTrackph/Washtrack/commit/bc1d808f3f4a2d9363f9d43f41fd3d5c352c46f4))
* integrate email scheduler into AppContext with 5-min interval ([b1a5a00](https://github.com/WashTrackph/Washtrack/commit/b1a5a00bb4faba7a91221835c4ceb71826f497d0))


### Bug Fixes

* add customer deletion with cascading order and SMS log removal ([902efd1](https://github.com/WashTrackph/Washtrack/commit/902efd14e2f8bd598479d347d153894ecbc44655))

## [1.2.0-rc.1](https://github.com/WashTrackph/Washtrack/compare/v1.1.0-rc.1...v1.2.0-rc.1) (2026-03-11)


### Features

* service quantity, SMS, security hardening & UX fixes ([0cbda6d](https://github.com/WashTrackph/Washtrack/commit/0cbda6d9750ed379f4619826e30505c1724196ce))


### Bug Fixes

* POS new customer flow, unpaid order UX, and placeholder rendering ([4292c88](https://github.com/WashTrackph/Washtrack/commit/4292c88f1bbd9e54e1160e44a4e707d914f1d24b))

## [1.1.0-rc.1](https://github.com/WashTrackph/Washtrack/compare/v1.0.0-rc.1...v1.1.0-rc.1) (2026-03-11)


### Features

* add drag-and-drop to kanban board ([c8021b0](https://github.com/WashTrackph/Washtrack/commit/c8021b035d6b7f32f0c7c5c3dd26cd5f129cfaab))
* add pay-later flow for orders with deferred payment collection ([abd5d75](https://github.com/WashTrackph/Washtrack/commit/abd5d75bb44a8021bd828a1dff43d8208d6945ec))
* add release-please, Windows build, and fix project metadata ([1344fc5](https://github.com/WashTrackph/Washtrack/commit/1344fc5eea80041c75c29ee6f88b8500a8ad58dd))
* add release-please, Windows build, and fix project metadata ([c0312c8](https://github.com/WashTrackph/Washtrack/commit/c0312c85dbc677c65b0b3e5fe9431687fe7c648e))
* allow multiple quantities for flat rate and fixed load services ([cfba524](https://github.com/WashTrackph/Washtrack/commit/cfba52496b4590ebf41b8c8f0b3f97058f56c708))
* background SMS status checks with toast notifications ([b145bde](https://github.com/WashTrackph/Washtrack/commit/b145bde2b167d7c6eab84a81603392bb04a0c3e3))
* service quantity multiplier, SMS integration & security hardening ([08b2737](https://github.com/WashTrackph/Washtrack/commit/08b273769904c51e2281b619cdaad1e092c3453e))
* wire up SMS sending to Semaphore API via Tauri backend ([bc6029a](https://github.com/WashTrackph/Washtrack/commit/bc6029a20fe846fd58200fd3dcf70c058d2ac540))


### Bug Fixes

* make customer phone number optional ([d8442c9](https://github.com/WashTrackph/Washtrack/commit/d8442c9f69aa9442f42114aac95b3a99fc941b64))
* prevent duplicate Ready SMS when order moves back and forward ([4825f04](https://github.com/WashTrackph/Washtrack/commit/4825f049bea3e48c90cf82b185e12d85b14bc52d))
* remove PIN gate from payment collection (staff-level action) ([d284adb](https://github.com/WashTrackph/Washtrack/commit/d284adb403046b2bf0935d75c91d1f38aef517ac))
* replace HTML5 drag-and-drop with pointer events for kanban ([e8b9b23](https://github.com/WashTrackph/Washtrack/commit/e8b9b23af80b66623f0b518ec81b6eb4e4c6a5f8))
* security hardening and verification fixes ([5876017](https://github.com/WashTrackph/Washtrack/commit/5876017c1d64800726828d6bd312313569f0f349))


### Reverts

* restore original seed PINs for mock/demo data ([310d786](https://github.com/WashTrackph/Washtrack/commit/310d786357ee96a3ab1be474637a4701e9cc5c06))
