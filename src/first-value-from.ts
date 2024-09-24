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
  let firstValueFromAdded = false;

  root
    .find(j.CallExpression, {
      callee: { property: { name: 'toPromise' } },
    })
    .forEach((path: ASTPath<CallExpression>) => {
      const toPromiseCall = path.value.callee;

      if (
        j.MemberExpression.check(toPromiseCall) &&
        j.CallExpression.check(toPromiseCall.object) &&
        j.MemberExpression.check(toPromiseCall.object.callee)
      ) {
        const pipeCall = toPromiseCall.object;
        const takeCall = pipeCall.arguments.find(
          (arg) =>
            j.CallExpression.check(arg) &&
            j.Identifier.check(arg.callee) &&
            ((arg.callee.name === 'take' &&
              j.NumericLiteral.check(arg.arguments[0]) &&
              arg.arguments[0].value === 1) ||
              arg.callee.name === 'first'),
        );

        if (!takeCall) return;

        pipeCall.arguments = pipeCall.arguments.filter(
          (arg) => arg !== takeCall,
        );

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
    root
      .get()
      .node.program.body.unshift(
        j.importDeclaration(
          [j.importSpecifier(j.identifier('firstValueFrom'))],
          j.literal('rxjs'),
        ),
      );
  }

  for (const operator of ['first', 'take']) {
    root
      .find(j.ImportDeclaration, { source: { value: 'rxjs/operators' } })
      .forEach((importPath) => {
        const importDeclaration = importPath.value;

        if (
          root.find(j.CallExpression, {
            callee: { name: operator },
          }).length
        ) {
          return;
        }

        const remainingSpecifiers = importDeclaration.specifiers?.filter(
          (specifier) =>
            j.ImportSpecifier.check(specifier) &&
            j.Identifier.check(specifier.imported) &&
            specifier.imported.name !== operator,
        );

        if (remainingSpecifiers?.length) {
          importDeclaration.specifiers = remainingSpecifiers;
        } else {
          j(importPath).remove();
        }
      });
  }

  return root.toSource();
}

export const parser = 'ts';
