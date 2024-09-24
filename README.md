# jscodeshift-rxjs-first-value-from

[![npm](https://img.shields.io/npm/v/jscodeshift-rxjs-first-value-from?style=flat-square)](https://www.npmjs.com/package/jscodeshift-rxjs-first-value-from?activeTab=versions)
[![NPM](https://img.shields.io/npm/l/jscodeshift-rxjs-first-value-from?style=flat-square)](https://raw.githubusercontent.com/manbearwiz/jscodeshift-rxjs-first-value-from/master/LICENSE)
[![npm](https://img.shields.io/npm/dt/jscodeshift-rxjs-first-value-from?style=flat-square)](https://www.npmjs.com/package/jscodeshift-rxjs-first-value-from)
[![GitHub issues](https://img.shields.io/github/issues/manbearwiz/jscodeshift-rxjs-first-value-from?style=flat-square)](https://github.com/manbearwiz/jscodeshift-rxjs-first-value-from/issues)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release&style=flat-square)](https://github.com/semantic-release/semantic-release)

This codemod automates the migration from RxJS’s deprecated `.toPromise()` method to `firstValueFrom` and `lastValueFrom`. Promises piped with `take(1)` or `first()` are replaced with `firstValueFrom`, while other cases default to `lastValueFrom`. Import statements are also updated to include the new functions and remove unused imports.

- [jscodeshift-rxjs-first-value-from](#jscodeshift-rxjs-first-value-from)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Options](#options)
    - [Examples](#examples)
      - [`toPromise` to `firstValueFrom`](#topromise-to-firstvaluefrom)
  - [Running Unit Tests](#running-unit-tests)
  - [Contributing](#contributing)
  - [License](#license)

## Installation

To install the codemod, you can use `npm` or `yarn`.

```bash
npm install --save-dev first-value-from-codemod
# or
yarn add --dev first-value-from-codemod
```

You'll also need [jscodeshift](https://github.com/facebook/jscodeshift), the framework that powers this codemod.

```bash
npm install -g jscodeshift
```

## Usage

To run the codemod, use the `jscodeshift` CLI and specify the path to the files you want to transform.

```bash
jscodeshift -t ./node_modules/first-value-from-codemod/transform.js path/to/your/files
```

### Options

You can pass options to the codemod via `jscodeshift` if needed. This example is minimal in options, but you can extend or customize the script based on your project requirements.

### Examples

#### `toPromise` to `firstValueFrom`

When calling `toPromise` on a pipe containing `take(1)` or `first()` the codemod will replace it with `firstValueFrom`.

Before:

```ts
import { take, map } from "rxjs/operators";

const name = getUser().pipe(map((user) => user.name), take(1)).toPromise();
```

After running the codemod:

```ts
import { firstValueFrom } from "rxjs";
import { map } from "rxjs/operators";

const name = firstValueFrom(getUser().pipe(map((user) => user.name)));
```

## Running Unit Tests

This repository includes a suite of unit tests to ensure the codemod behaves as expected across a variety of cases.

To run the tests, install the dependencies and use `vitest`:

```sh
npm install
npm test
```

## Contributing

Contributions are welcome! If you’d like to contribute, please fork the repository and submit a pull request.

1. Fork the project
2. Create a feature branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature-name`)
5. Open a pull request

Please make sure to update tests as appropriate.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
