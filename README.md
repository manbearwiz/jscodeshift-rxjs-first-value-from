# jscodeshift-rxjs-first-value-from

[![npm](https://img.shields.io/npm/v/jscodeshift-rxjs-first-value-from?style=flat-square)](https://www.npmjs.com/package/jscodeshift-rxjs-first-value-from?activeTab=versions)
[![NPM](https://img.shields.io/npm/l/jscodeshift-rxjs-first-value-from?style=flat-square)](https://raw.githubusercontent.com/manbearwiz/jscodeshift-rxjs-first-value-from/master/LICENSE)
[![npm](https://img.shields.io/npm/dt/jscodeshift-rxjs-first-value-from?style=flat-square)](https://www.npmjs.com/package/jscodeshift-rxjs-first-value-from)
[![GitHub issues](https://img.shields.io/github/issues/manbearwiz/jscodeshift-rxjs-first-value-from?style=flat-square)](https://github.com/manbearwiz/jscodeshift-rxjs-first-value-from/issues)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release&style=flat-square)](https://github.com/semantic-release/semantic-release)

**jscodeshift-rxjs-first-value-from** is a codemod for [jscodeshift](https://github.com/facebook/jscodeshift) that transforms `toPromise` calls to `firstValueFrom` calls in RxJS v7.

## Installation

Before using the codemod script, make sure you have **jscodeshift** installed. You can do this using the following command:

```sh
npm install -g jscodeshift jscodeshift-rxjs-first-value-from
```

## Usage

To apply the codemod to all TypeScript files in the `src` directory, you can use the following command:

```sh
jscodeshift -t node_modules/jscodeshift-rxjs-first-value-from/src/first-value-from.ts src/**/*.ts
```

### Options

There are no options available for this codemod at the moment.
