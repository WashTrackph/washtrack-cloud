# Changelog

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
