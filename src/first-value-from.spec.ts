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

describe('first-value-from', () => {
  it('handles simple case', () => {
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

  it('handles multiple operators in pipe', () => {
    transformTest(
      `
import { take } from "rxjs/operators";

const user = getUser().pipe(
  map((user) => user.name),
  take(1),
).toPromise();
`,
      `
import { firstValueFrom } from "rxjs";

const user = firstValueFrom(getUser().pipe(map((user) => user.name)));
      `,
    );
  });

  it('should not transform if take is not 1', () => {
    transformTest(
      `
import { take } from "rxjs/operators";

const user = getUser().pipe(take(2)).toPromise();
`,
      `
import { take } from "rxjs/operators";

const user = getUser().pipe(take(2)).toPromise();
      `,
    );
  });

  it('handles multiple awaits', () => {
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

  it('handles async arrow function', () => {
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
});
