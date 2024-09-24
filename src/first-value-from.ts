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
  const importsAdded = new Set<string>();

  root
    .find(j.CallExpression, { callee: { property: { name: 'toPromise' } } })
    .forEach((path: ASTPath<CallExpression>) => {
      const toPromiseCall = path.value.callee;

      if (
        j.MemberExpression.check(toPromiseCall) &&
        j.CallExpression.check(toPromiseCall.object)
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

        if (takeCall) {
          pipeCall.arguments = pipeCall.arguments.filter(
            (arg) => arg !== takeCall,
          );
        }

        const promiseFn = takeCall ? 'firstValueFrom' : 'lastValueFrom';
        importsAdded.add(promiseFn);
        j(path).replaceWith(
          j.callExpression(j.identifier(promiseFn), [
            pipeCall.arguments.length
              ? pipeCall
              : j.MemberExpression.check(toPromiseCall.object.callee)
                ? toPromiseCall.object.callee.object
                : toPromiseCall.object,
          ]),
        );
      }
    });

  importsAdded.forEach((importName) => {
    const rxjsImport = root.find(j.ImportDeclaration, {
      source: { value: 'rxjs' },
    });

    if (rxjsImport.length) {
      const importDeclaration = rxjsImport.get().value;

      if (
        j.ImportDeclaration.check(importDeclaration) &&
        importDeclaration.specifiers
      ) {
        if (
          !importDeclaration.specifiers?.some(
            (specifier) =>
              j.ImportSpecifier.check(specifier) &&
              j.Identifier.check(specifier.imported) &&
              specifier.imported.name === importName,
          )
        ) {
          importDeclaration.specifiers.push(
            j.importSpecifier(j.identifier(importName)),
          );
        }
      }
    } else {
      const newImport = j.importDeclaration(
        [j.importSpecifier(j.identifier(importName))],
        j.literal('rxjs'),
      );

      const rxjsOperatorsImport = root.find(j.ImportDeclaration, {
        source: { value: 'rxjs/operators' },
      });

      if (rxjsOperatorsImport.length) {
        rxjsOperatorsImport.insertBefore(newImport);
      } else {
        root.get().node.program.body.unshift(newImport);
      }
    }
  });

  ['first', 'take'].forEach((operator) => {
    root
      .find(j.ImportDeclaration, { source: { value: 'rxjs/operators' } })
      .forEach((importPath) => {
        const importDeclaration = importPath.value;

        if (
          !root.find(j.CallExpression, { callee: { name: operator } }).length
        ) {
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
        }
      });
  });

  return root.toSource();
}

export const parser = 'ts';
