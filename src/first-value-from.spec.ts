import { applyTransform } from 'jscodeshift/src/testUtils';
import { describe, expect, it } from 'vitest';
import * as transform from './first-value-from';

const t = (source: string) => applyTransform(transform, {}, { source }, {});

describe('first-value-from transformation', () => {
  it('transforms simple toPromise() with take(1)', () => {
    expect(
      t(
        `
import { take } from "rxjs/operators";

const user = getUser().pipe(take(1)).toPromise();
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { firstValueFrom } from "rxjs";

      const user = firstValueFrom(getUser());"
    `);
  });

  it('transforms simple toPromise() with first()', () => {
    expect(
      t(
        `
import { first } from "rxjs/operators";

const user = getUser().pipe(first()).toPromise();
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { firstValueFrom } from "rxjs";

      const user = firstValueFrom(getUser());"`);
  });

  it('transforms toPromise() without take(1) or first() to lastValueFrom()', () => {
    expect(
      t(
        `
const user = getUser().toPromise();
const org = org$.toPromise();
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { lastValueFrom } from "rxjs";
      const user = lastValueFrom(getUser());
      const org = lastValueFrom(org$);"`);
  });

  it('retains other pipe arguments when transforming', () => {
    expect(
      t(
        `
import { take, map } from "rxjs/operators";

const name = getUser().pipe(map((user) => user.name), take(1)).toPromise();
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { firstValueFrom } from "rxjs";
      import { map } from "rxjs/operators";

      const name = firstValueFrom(getUser().pipe(map((user) => user.name)));"`);
  });

  it('does not remove imports if used elsewhere', () => {
    expect(
      t(
        `
import { take, tap, map } from "rxjs/operators";

const name = getUser().pipe(map((user) => user.name), take(1)).toPromise();
const user$ = getUser().pipe(tap(console.log), take(1));
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { firstValueFrom } from "rxjs";
      import { take, tap, map } from "rxjs/operators";

      const name = firstValueFrom(getUser().pipe(map((user) => user.name)));
      const user$ = getUser().pipe(tap(console.log), take(1));"`);
  });

  it('transforms toPromise() with take(!=1) to lastValueFrom()', () => {
    expect(
      t(
        `
import { take } from "rxjs/operators";

const user = getUser().pipe(take(2)).toPromise();
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { lastValueFrom } from "rxjs";
      import { take } from "rxjs/operators";

      const user = lastValueFrom(getUser().pipe(take(2)));"`);
  });

  it('handles multiple multipe promises', () => {
    expect(
      t(
        `
import { take } from "rxjs/operators";

async function initialize() {
  const [user, org] = await Promise.all([
    getUser().pipe(take(1)).toPromise(),
    getOrg().pipe(filterNull(), take(1)).toPromise(),
  ]);

  return user;
}
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { firstValueFrom } from "rxjs";

      async function initialize() {
        const [user, org] = await Promise.all([
          firstValueFrom(getUser()),
          firstValueFrom(getOrg().pipe(filterNull())),
        ]);

        return user;
      }"`);
  });

  it('transforms toPromise() with take(1) and async function', () => {
    expect(
      t(
        `
import { take } from "rxjs/operators";

transform = async (path: string): Promise<string> =>
  this.service
    .transform(path)
    .pipe(take(1))
    .toPromise();
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { firstValueFrom } from "rxjs";

      transform = async (path: string): Promise<string> =>
        firstValueFrom(this.service
          .transform(path));"`);
  });

  it('does not transform if toPromise() is not called', () => {
    expect(
      t(
        `
const user = getUser();
      `,
      ),
    ).toMatchInlineSnapshot(`"const user = getUser();"`);
  });

  it('uses lastValueFrom if take(1) is not in the pipe', () => {
    expect(
      t(
        `
import { map } from "rxjs/operators";

const name = getUser().pipe(map((user) => user.name)).toPromise();
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { lastValueFrom } from "rxjs";
      import { map } from "rxjs/operators";

      const name = lastValueFrom(getUser().pipe(map((user) => user.name)));"`);
  });

  it('adds import for firstValueFrom to existing rxjs import statement if it exists', () => {
    expect(
      t(
        `
import { Observable } from "rxjs";
import { take } from "rxjs/operators";

const user = getUser().pipe(take(1)).toPromise();
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { Observable, firstValueFrom } from "rxjs";

      const user = firstValueFrom(getUser());"`);
  });

  it('add the import in the correct order', () => {
    expect(
      t(
        `
import { foo } from "bar";
import { take, map } from "rxjs/operators";

const name = getUser().pipe(take(1), map((user) => user.name)).toPromise();
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { foo } from "bar";
      import { firstValueFrom } from "rxjs";
      import { map } from "rxjs/operators";

      const name = firstValueFrom(getUser().pipe(map((user) => user.name)));"`);
  });

  it('can handle chained methods that are not pipe and do not have arguments', () => {
    expect(
      t(
        `
const results = await this.service.open().after().toPromise<Foo | null>();
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { lastValueFrom } from "rxjs";
      const results = await lastValueFrom(this.service.open().after());"`);
  });

  it('can handle chained methods that are not pipe and have arguments', () => {
    expect(
      t(
        `
import { getArgs } from "./args";

const results = await this.service.open(getArgs()).after(take(1), first()).toPromise<Foo | null>();
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { lastValueFrom } from "rxjs";
      import { getArgs } from "./args";

      const results = await lastValueFrom(this.service.open(getArgs()).after(take(1), first()));"`);
  });
});
