import { FirstOrderStudioComponent, StudioComponent } from '@amzn/amplify-ui-codegen-schema';
import { StudioTemplateRenderer } from '@amzn/studio-ui-codegen';

import { EOL } from 'os';
import ts, {
  createPrinter,
  createSourceFile,
  EmitHint,
  factory,
  FunctionDeclaration,
  JsxElement,
  JsxFragment,
  NewLineKind,
  ScriptKind,
  ScriptTarget,
  SyntaxKind,
  transpileModule,
} from 'typescript';
import { ImportCollection } from './import-collection';
import ReactOutputManager from './react-output-manager';

export abstract class ReactStudioTemplateRenderer extends StudioTemplateRenderer<
  string,
  ReactOutputManager,
  {
    componentText: string;
    renderComponentToFilesystem: (outputPath: string) => Promise<void>;
  }
> {
  protected importCollection = new ImportCollection();

  componentPath = `${this.component.name}.tsx`;

  constructor(component: FirstOrderStudioComponent) {
    super(component, new ReactOutputManager());
  }

  renderComponentOnly() {
    const jsx = this.renderJsx(this.component);

    const { printer, file } = this.createPrinter();

    console.log('JSX rendered');

    const imports = this.importCollection.buildImportStatements();

    let importsText = '';

    for (let importStatement of imports) {
      const result = printer.printNode(EmitHint.Unspecified, importStatement, file);
      importsText += result + EOL;
    }

    const wrappedFunction = this.renderFunctionWrapper(this.component.name, jsx);

    const result = printer.printNode(EmitHint.Unspecified, wrappedFunction, file);

    let compiled = transpileModule(result, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2015,
        jsx: ts.JsxEmit.React,
      },
    });

    const compText = compiled.outputText.replace('export default ', '');

    return {compText, importsText};
  }

  renderComponent() {
    // This is a react component so we only need a single tsx

    const { printer, file } = this.createPrinter();

    const jsx = this.renderJsx(this.component);

    console.log('JSX rendered');

    const wrappedFunction = this.renderFunctionWrapper(this.component.name, jsx);

    const imports = this.importCollection.buildImportStatements();

    let componentText = '/* eslint-disable */' + EOL;

    for (let importStatement of imports) {
      const result = printer.printNode(EmitHint.Unspecified, importStatement, file);
      componentText += result + EOL;
    }

    componentText += EOL;

    const result = printer.printNode(EmitHint.Unspecified, wrappedFunction, file);
    componentText += result;

    console.log(componentText);

    return {
      componentText,
      renderComponentToFilesystem: this.renderComponentToFilesystem(componentText),
    };
  }

  private createPrinter() {
    const file = createSourceFile(this.componentPath, '', ScriptTarget.ESNext, false, ScriptKind.TSX);

    const printer = createPrinter({
      newLine: NewLineKind.LineFeed,
    });
    return { printer, file };
  }

  renderFunctionWrapper(componentName: string, jsx: JsxElement | JsxFragment): FunctionDeclaration {
    const componentPropType = componentName + 'Props';

    return factory.createFunctionDeclaration(
      undefined,
      [factory.createModifier(SyntaxKind.ExportKeyword), factory.createModifier(SyntaxKind.DefaultKeyword)],
      undefined,
      factory.createIdentifier(componentName),
      undefined,
      [
        factory.createParameterDeclaration(
          undefined,
          undefined,
          undefined,
          'props',
          undefined,
          factory.createTypeReferenceNode(componentPropType, undefined),
          undefined,
        ),
      ],
      factory.createTypeReferenceNode(
        factory.createQualifiedName(factory.createIdentifier('JSX'), factory.createIdentifier('Element')),
        undefined,
      ),
      factory.createBlock([factory.createReturnStatement(factory.createParenthesizedExpression(jsx))], true),
    );
  }

  abstract renderJsx(component: StudioComponent): JsxElement | JsxFragment;
}
