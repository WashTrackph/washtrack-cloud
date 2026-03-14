# Changelog

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
