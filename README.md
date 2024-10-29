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
      - [`toPromise` to `lastValueFrom`](#topromise-to-lastvaluefrom)
      - [`toPromise` with type argument](#topromise-with-type-argument)
      - [`subscribe` to `firstValueFrom`](#subscribe-to-firstvaluefrom)
  - [Running Unit Tests](#running-unit-tests)
  - [Contributing](#contributing)
  - [License](#license)

## Installation

To install the codemod, you can use `npm` or `yarn`.

```bash
npm install --save-dev jscodeshift-rxjs-first-value-from
# or
yarn add --dev jscodeshift-rxjs-first-value-from
```

You'll also need [jscodeshift](https://github.com/facebook/jscodeshift), the framework that powers this codemod.

```bash
npm install -g jscodeshift
```

## Usage

To run the codemod, use the `jscodeshift` CLI and specify the path to the files you want to transform.

```bash
jscodeshift -t ./node_modules/jscodeshift-rxjs-first-value-from/src/first-value-from.ts src
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

#### `toPromise` to `lastValueFrom`

When calling `toPromise` on a pipe without `take(1)` or `first()` the codemod will replace it with `lastValueFrom`.

Before:

```ts
import { map } from "rxjs/operators";

const name = getUser().pipe(map((user) => user.name)).toPromise();
```

After running the codemod:

```ts
import { lastValueFrom } from "rxjs";
import { map } from "rxjs/operators";

const name = lastValueFrom(getUser().pipe(map((user) => user.name)));
```

#### `toPromise` with type argument

When calling `toPromise` with a type argument, the codemod will cast the observable to the specified type.

Before:

```ts
import { map } from "rxjs/operators";

const name = getUser().pipe(map((user) => user.name)).toPromise<string>();
```

After running the codemod:

```ts
import { lastValueFrom } from "rxjs";
import { map } from "rxjs/operators";

const name = lastValueFrom(getUser().pipe(map((user) => user.name)) as Observable<string>);
```

#### `subscribe` to `firstValueFrom`

When calling `subscribe` on an observable with a single value, the codemod will replace it with `firstValueFrom`.

Before:

```ts
import { map } from "rxjs/operators";

getUser().pipe(map((user) => user.name), take(1)).subscribe((name) => console.log(name));
```

After running the codemod:

```ts
import { firstValueFrom } from "rxjs";
import { map } from "rxjs/operators";

firstValueFrom(getUser().pipe(map((user) => user.name))).then((name) => console.log(name));
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
