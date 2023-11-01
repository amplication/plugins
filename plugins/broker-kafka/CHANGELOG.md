# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [2.0.0]

This version:

- adds support for DSG v2+ and Nestjs v10+
- updates `kafka.controller.ts` to the new signature still maintaing back compatibilty to old variables to reduce users custom code issues
- adds support for custom named message broker

### Changes

<li> <a href="http://github.com/amplication/plugins/commit/1015b2a08e918e5f8755bde64688b725da66c4a8">1015b2a &bull;</a> chore(kafka): update deps and webpack config</li>å
<li> <a href="http://github.com/amplication/plugins/commit/81409d924bfc4bd1d7fa0ac5194a57a2135d5fb3">81409d9 &bull;</a> chore(kafka): add default jest config to package.json</li>
<li> <a href="http://github.com/amplication/plugins/commit/ecdcbb3d4db7c6f7b26c897fc10a503f7260e215">ecdcbb3 &bull;</a> feat(kafka): update generated code to nestjs v10</li>
<li> <a href="http://github.com/amplication/plugins/commit/8675c427fb79c24eb9c47d5e3f072e4e0436a2d1">8675c42 &bull;</a> feat(kafka): add support for custom named message broker</li>
<li> <a href="http://github.com/amplication/plugins/commit/e3e12b5f7b0d22eb8713c3a99d455aaf3a865e9f">e3e12b5 &bull;</a> chore(kafka): bump version to 2.0.0</li>