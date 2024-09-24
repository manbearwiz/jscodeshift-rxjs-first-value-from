import type {
  API,
  ASTPath,
  CallExpression,
  FileInfo,
  Options,
} from 'jscodeshift';

export default function transform(
  file: FileInfo,
  api: API,
  _options: Options,
): string | undefined {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Find all toPromise() calls with a take(1) call in the pipe() call chain and replace them with firstValueFrom()

  let firstValueFromAdded = false;

  // biome-ignore lint/complexity/noForEach: <explanation>
  root
    .find(j.CallExpression, {
      callee: {
        property: {
          name: 'toPromise',
        },
      },
    })
    .forEach((path: ASTPath<CallExpression>) => {
      const toPromiseCall = path.value.callee;
      if (
        j.MemberExpression.check(toPromiseCall) &&
        j.CallExpression.check(toPromiseCall.object) &&
        j.MemberExpression.check(toPromiseCall.object.callee) &&
        j.CallExpression.check(toPromiseCall.object.callee.object)
      ) {
        const pipeCall = toPromiseCall.object;
        const takeCall = pipeCall.arguments.find(
          (arg) =>
            j.CallExpression.check(arg) &&
            j.Identifier.check(arg.callee) &&
            arg.callee.name === 'take' &&
            j.NumericLiteral.check(arg.arguments[0]) &&
            arg.arguments[0].value === 1,
        ) as CallExpression;

        if (!takeCall) {
          return;
        }

        const takeCallIndex = pipeCall.arguments.indexOf(takeCall);
        pipeCall.arguments.splice(takeCallIndex, 1);

        const firstValueFromCall = j.callExpression(
          j.identifier('firstValueFrom'),
          [
            pipeCall.arguments.length
              ? pipeCall
              : toPromiseCall.object.callee.object,
          ],
        );

        firstValueFromAdded = true;

        j(path).replaceWith(firstValueFromCall);
      }
    });

  if (firstValueFromAdded) {
    // add import statement for firstValueFrom
    const rxjsImport = j.importDeclaration(
      [j.importSpecifier(j.identifier('firstValueFrom'))],
      j.literal('rxjs'),
    );

    root.get().node.program.body.unshift(rxjsImport);
  }

  // biome-ignore lint/complexity/noForEach: <explanation>
  root
    .find(j.ImportDeclaration, {
      source: {
        value: 'rxjs/operators',
      },
    })
    .forEach((importPath) => {
      const importDeclaration = importPath.value;
      const takeImport = importDeclaration.specifiers?.find((specifier) => {
        return (
          j.ImportSpecifier.check(specifier) &&
          j.Identifier.check(specifier.imported) &&
          specifier.imported.name === 'take'
        );
      });

      if (!takeImport?.local?.name) {
        return;
      }

      const takeImportUsed = root.find(j.CallExpression, {
        callee: {
          name: 'take',
        },
      }).length;

      if (takeImportUsed === 0) {
        j(importPath).remove();
      }
    });

  return root.toSource();
}

export const parser = 'ts';
