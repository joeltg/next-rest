# next-rest

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme) [![license](https://img.shields.io/github/license/joeltg/next-rest)](https://opensource.org/licenses/MIT) [![NPM version](https://img.shields.io/npm/v/next-rest)](https://www.npmjs.com/package/next-rest) ![TypeScript types](https://img.shields.io/npm/types/next-rest) ![lines of code](https://img.shields.io/tokei/lines/github/joeltg/next-rest)

Typesafe REST APIs for Next.js.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Background

This library is a lightweight framework for writing **end-to-end** typesafe JSON REST APIs for Next.js in TypeScript.

Features:

- **Modularity**. Instead of making you define all of your route types in one place, next-rest uses module augmentation so that you can declare each route's type in their own respective file. All of the logic for an API route `/api/foo/bar` is contained in the `/pages/api/foo/bar.ts` page.
- **Minimalism**. The client API is 150 lines and just calls `fetch` like you'd expect. next-rest has one non-dev dependency on [http-status-codes](https://www.npmjs.com/package/http-status-codes). All validation happens on the server; using next-rest won't cause your validation library to get bundled into the client.
- **Safety**: next-rest lets you write APIs where the URL parameters, request headers, request body, response headers, and response body are all (!!) strongly typed for each combination of route and method. All of your API calls get typechecked at compile-time by TypeScript _and_ validated at runtime on the server.

Limitations:

- **JSON-only**. next-rest is JSON-only.
- **Internal use only**. next-rest is designed for implementing and calling REST APIs **within** a single Next.js application. You can't export your API types, or import a different project's API types. If _that's_ what you're after, you probably want something like [restyped](https://github.com/rawrmaan/restyped/).
- Requires TypeScript 4.4+, Next.js 12+, and React 17+

## Install

```
npm i next-rest
```

## Usage

The easiest way to understand next-rest is to clone the example repo [joeltg/next-rest-example](https://github.com/joeltg/next-rest-example) and poke around with VSCode.

## Contributing

If you find a bug or have a suggestion, feel free to open an issue to discuss it!

## License

MIT © 2020 Joel Gustafson
