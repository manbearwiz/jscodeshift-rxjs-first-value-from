import type { Options } from 'jscodeshift';
import { runInlineTest } from 'jscodeshift/src/testUtils';
import { describe, it } from 'vitest';
import * as transform from './first-value-from';

function transformTest(
  input: string,
  expectedOutput: string,
  options: Options = {},
) {
  runInlineTest(transform, options, { source: input }, expectedOutput);
}

describe('first-value-from transformation', () => {
  it('transforms simple toPromise() with take(1)', () => {
    transformTest(
      `
import { take } from "rxjs/operators";

const user = getUser().pipe(take(1)).toPromise();
`,
      `
import { firstValueFrom } from "rxjs";

const user = firstValueFrom(getUser());
      `,
    );
  });

  it('transforms simple toPromise() with first()', () => {
    transformTest(
      `
import { first } from "rxjs/operators";

const user = getUser().pipe(first()).toPromise();
`,
      `
import { firstValueFrom } from "rxjs";

const user = firstValueFrom(getUser());
      `,
    );
  });

  it('transforms toPromise() without take(1) or first() to lastValueFrom()', () => {
    transformTest(
      `
const user = getUser().toPromise();
`,
      `
import { lastValueFrom } from "rxjs";
const user = lastValueFrom(getUser());
      `,
    );
  });

  it('transforms toPromise() with multiple operators', () => {
    transformTest(
      `
import { take, map } from "rxjs/operators";

const user = getUser().pipe(map((user) => user.name), take(1)).toPromise();
`,
      `
import { firstValueFrom } from "rxjs";
import { map } from "rxjs/operators";

const user = firstValueFrom(getUser().pipe(map((user) => user.name)));
      `,
    );
  });

  it('does not remove take import if it is used elsewhere', () => {
    transformTest(
      `
import { take, tap, map } from "rxjs/operators";

const name = getUser().pipe(map((user) => user.name), take(1)).toPromise();
const user$ = getUser().pipe(tap(console.log), take(1));
`,
      `
import { firstValueFrom } from "rxjs";
import { take, tap, map } from "rxjs/operators";

const name = firstValueFrom(getUser().pipe(map((user) => user.name)));
const user$ = getUser().pipe(tap(console.log), take(1));
      `,
    );
  });

  it('transforms toPromise() with take(!=1) to lastValueFrom()', () => {
    transformTest(
      `
import { take } from "rxjs/operators";

const user = getUser().pipe(take(2)).toPromise();
`,
      `
import { lastValueFrom } from "rxjs";
import { take } from "rxjs/operators";

const user = lastValueFrom(getUser().pipe(take(2)));
      `,
    );
  });

  it('handles multiple awaits with take(1)', () => {
    transformTest(
      `
import { take } from "rxjs/operators";

async function initializeFeatureFlags() {
  const [user, { slug }] = await Promise.all([
    getLoggedInUser().pipe(take(1)).toPromise(),
    getTenant().pipe(filterNull(), take(1)).toPromise(),
  ]);

  return user;
}`,
      `
import { firstValueFrom } from "rxjs";

async function initializeFeatureFlags() {
  const [user, { slug }] = await Promise.all([
    firstValueFrom(getLoggedInUser()),
    firstValueFrom(getTenant().pipe(filterNull())),
  ]);

  return user;
}`,
    );
  });

  it('handles async arrow function transformation', () => {
    transformTest(
      `
import { take } from "rxjs/operators";

getInternal = async (path: string): Promise<string> =>
  this.prependSlugPipe
    .transform(path)
    .pipe(take(1))
    .toPromise();`,
      `
import { firstValueFrom } from "rxjs";

getInternal = async (path: string): Promise<string> =>
  firstValueFrom(this.prependSlugPipe
    .transform(path));
  `,
    );
  });

  it('transforms simple toPromise() without pipe', () => {
    transformTest(
      `
const user = getUser().toPromise();
`,
      `
import { lastValueFrom } from "rxjs";
const user = lastValueFrom(getUser());
      `,
    );
  });

  it('does not transform if no take(1) or toPromise()', () => {
    transformTest(
      `
const user = getUser();
`,
      `
const user = getUser();
      `,
    );
  });

  it('uses lastValueFrom if take(1) is not in the pipe', () => {
    transformTest(
      `
import { map } from "rxjs/operators";

const user = getUser().pipe(map((user) => user.name)).toPromise();
`,
      `
import { lastValueFrom } from "rxjs";
import { map } from "rxjs/operators";

const user = lastValueFrom(getUser().pipe(map((user) => user.name)));
      `,
    );
  });

  it('adds import for firstValueFrom to existing rxjs import statement if it exists', () => {
    transformTest(
      `
import { Observable } from "rxjs";
import { take } from "rxjs/operators";

const user = getUser().pipe(take(1)).toPromise();
`,
      `
import { Observable, firstValueFrom } from "rxjs";

const user = firstValueFrom(getUser());
      `,
    );
  });

  it('add the import in the correct order', () => {
    transformTest(
      `
import { foo } from "bar";
import { take, map } from "rxjs/operators";

const name = getUser().pipe(take(1), map((user) => user.name)).toPromise();
`,
      `
import { foo } from "bar";
import { firstValueFrom } from "rxjs";
import { map } from "rxjs/operators";

const name = firstValueFrom(getUser().pipe(map((user) => user.name)));
      `,
    );
  });
});
