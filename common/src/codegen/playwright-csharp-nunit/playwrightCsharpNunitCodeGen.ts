import { EOL } from "os";
import path from "path";
import {
  ISourceProjectMetadata,
  ITestCase,
  ITestRoutine,
  ITestSuite,
  LocatorType,
  StandardFolder,
  StandardOutputFolder,
} from "../../file-defs";
import { IPage } from "../../file-defs/pageFile";
import { StandardOutputFile } from "../../file-defs/standardOutputFile";
import { ICodeGen, WriteFileFn } from "../types";
import { hasPlaceholder, upperCaseFirstChar } from "../utils/stringUtils";
import { NunitProjectMetaGenerator } from "./nunitProjectMetaGenerator";
import { PlaywrightCsharpNunitTemplatesProvider } from "./playwrightCsharpNunitTemplatesProvider";
import { IDataSetInfo } from "../playwright-charp-common/dataSetInfo";
import { PlaywrightCsharpCodeGen } from "../playwright-charp-common/playwrightCsharpCodeGen";
import { IOutputProjectMetadataGenerator } from "../playwright-charp-common/outputProjectMetadataProcessor";
import generateDatasetInfos from "../playwright-charp-common/generateDatasetInfos";
import { IPlaywrightCsharpTemplatesProvider } from "../playwright-charp-common/playwrightCsharpTemplatesProvider";
import { createOutputProjectMetadata } from "../codegenOutputProjectMeta";
import { addIndent } from "../utils/codegenUtils";

export class PlaywrightCsharpNunitCodeGen extends PlaywrightCsharpCodeGen implements ICodeGen {
  constructor(projMeta: ISourceProjectMetadata) {
    super(projMeta);
  }

  protected override getOutProjMeta(): IOutputProjectMetadataGenerator {
    return new NunitProjectMetaGenerator(this._projMeta);
  }

  protected override getTemplateProvider(): IPlaywrightCsharpTemplatesProvider {
    return new PlaywrightCsharpNunitTemplatesProvider(
      path.join(this._rmprojFile.folderPath, StandardFolder.CustomCode, "templates"),
      this._rmprojFile.content.indent,
      this._rmprojFile.content.indentSize
    );
  }

  async generateCode(full: boolean, writeFile: (path: string, content: string) => Promise<void>): Promise<string> {
    await this.generateEnvironmentSettingsFile(writeFile);
    await this.generateEnvironmentSetterScripts(writeFile);

    await this.generatePageFiles(writeFile);
    await this.generateCaseFiles(writeFile);
    await this.generateRoutineFiles(writeFile);
    await this.generateSuiteFiles(writeFile);
    await this.generateSupportFiles(writeFile);

    if (full) {
      await this.generateProjectFiles(writeFile);
    }

    await this.generateMetaFiles(writeFile);

    return "";
  }

  async generateRoutineFiles(writeFile: WriteFileFn) {
    // Filename: TestRoutines/{TestRoutineName}.cs
    for (let { content: testRoutine } of this._projMeta.testRoutines) {
      const datasets: IDataSetInfo[] = generateDatasetInfos(testRoutine);
      const testRoutinesClasses: string[] = [];

      // For each dataset, we generate a separate routine class
      for (let dataset of datasets) {
        let testRoutineClass = this.generateTestRoutineClass(
          testRoutine,
          this._projMeta.pages.map((p) => p.content),
          dataset
        );
        testRoutinesClasses.push(testRoutineClass);
      }

      let testRoutineFile = this.generateTestRoutineFile(testRoutine, testRoutinesClasses);
      let outputFileRelPath = this._outProjMeta.get(testRoutine.id)!.outputFileRelPath;
      await writeFile(outputFileRelPath, testRoutineFile);
    }
  }

  async generateCaseFiles(writeFile: WriteFileFn) {
    // # Generate TestCase files

    for (let { content: testCase } of this._projMeta.testCases) {
      let testClassContent = this.generateTestCaseFile(
        testCase,
        this._projMeta.pages.map((p) => p.content),
        this._projMeta.testRoutines.map((p) => p.content)
      );
      let outputFileRelPath = this._outProjMeta.get(testCase.id)!.outputFileRelPath;

      await writeFile(outputFileRelPath, testClassContent);
    }
  }
  async generatePageFiles(writeFile: WriteFileFn) {
    // # Generate Page definition for each page
    // Filename: Pages/{PageName}.cs
    for (let page of this._projMeta.pages) {
      let filePath = this._outProjMeta.get(page.content.id)!.outputFileRelPath;
      await writeFile(filePath, this.generatePage(page.content));
    }
  }
  async generateSuiteFiles(writeFile: WriteFileFn) {
    // Filename: TestSuites/{TestClassName}.cs
    for (let testSuite of this._projMeta.testSuites) {
      let fileRelPath = this._outProjMeta.get(testSuite.content.id)!.outputFileRelPath;
      let classContent = this.generateTestSuiteFile(
        testSuite.content,
        this._projMeta.testCases.map((tcFile) => tcFile.content)
      );
      await writeFile(fileRelPath, classContent);
    }
  }

  async generateSupportFiles(writeFile: WriteFileFn) {
    // Each page definition will be a property
    // Filename: PageDefinitions.cs
    await writeFile(
      `${StandardOutputFile.PageDefinitions}${this._outputFileExt}`,
      this.generatePageDefinitions(this._projMeta.pages.map((p) => p.content))
    );

    // Filename: Support/LocatorHelper.cs
    await writeFile(
      `${StandardOutputFolder.Support}/${StandardOutputFile.LocatorHelper}${this._outputFileExt}`,
      this._templateProvider.getLocatorHelper(this._rmprojFile.content.rootNamespace)
    );
    // Filename: Support/TestCaseBase.cs
    await writeFile(
      `${StandardOutputFolder.Support}/${StandardOutputFile.TestCaseBase}${this._outputFileExt}`,
      this._templateProvider.getTestCaseBase(this._rmprojFile.content.rootNamespace)
    );

    // Filename: Support/TestSuiteBase.cs
    await writeFile(
      `${StandardOutputFolder.Support}/${StandardOutputFile.TestSuiteBase}${this._outputFileExt}`,
      this._templateProvider.getTestSuiteBase(
        this._rmprojFile.content.rootNamespace,
        this._rmprojFile.content.testIdAttributeName
      )
    );
  }
  async generateMetaFiles(writeFile: WriteFileFn) {
    // Write output project metadata
    const outputProjectMetadata = await createOutputProjectMetadata(this._rmprojFile);
    await writeFile(StandardOutputFile.MetaData, JSON.stringify(outputProjectMetadata, null, 2));
  }

  async generateProjectFiles(writeFile: WriteFileFn) {
    await writeFile(
      `${this._rmprojFile.content.rootNamespace}.csproj`,
      this._templateProvider.getCsProject(this._rmprojFile.content.rootNamespace)
    );
    await writeFile(
      `${StandardOutputFile.Usings}${this._outputFileExt}`,
      this._templateProvider.getUsings(this._rmprojFile.content.rootNamespace, this._projMeta.testRoutines.length > 0)
    );
    await writeFile(`${StandardOutputFile.RunSettings}`, this._templateProvider.getRunSettings());
  }

  generatePageDefinitions(pages: IPage[]): string {
    let usingDirectives: string[] = [];
    for (let page of pages) {
      let pageNamespace = this._outProjMeta.get(page.id)!.outputFileFullNamespace;
      let usingDirective = `using ${pageNamespace};`;
      if (!usingDirectives.includes(usingDirective)) {
        usingDirectives.push(usingDirective);
      }
    }

    let usings = usingDirectives.join(EOL);

    let pagesDeclarationItems = [];
    for (let page of pages) {
      let pageName = upperCaseFirstChar(this._outProjMeta.get(page.id)!.outputFileClassName);
      pagesDeclarationItems.push(`public ${pageName} ${pageName} { get; private set; }`);
    }
    let pagesDeclarations = pagesDeclarationItems.join(EOL);
    pagesDeclarations = addIndent(pagesDeclarations, this._indentString);
    //
    // Build constructor body
    // Example:
    // this.LoginPage = new LoginPage(this);
    //
    let pageInitItems = [];
    for (let page of pages) {
      let pageName = upperCaseFirstChar(this._outProjMeta.get(page.id)!.outputFileClassName);
      pageInitItems.push(`${pageName} = new ${pageName}(page);`);
    }

    let pageInits = pageInitItems.join(EOL);
    pageInits = addIndent(pageInits, this._indentString, 2);

    return this._templateProvider.getPageDefinitions(usings, this._rootNamespace, pagesDeclarations, pageInits);
  }

  private generatePage(page: IPage): string {
    let pageItems = [];

    for (let element of page.elements) {
      if (element.type === "pageElement") {
        pageItems.push(
          this._templateProvider.getLocator({
            elementName: upperCaseFirstChar(element.name!),
            locatorStr: element.locator || "",
            locatorType: element.findBy!,
            description: element.description!,
            hasParams: hasPlaceholder(element.locator!),
            returnedLocatorType:
              element.findBy! === LocatorType.IFrame ||
              element.findBy! === LocatorType.IFrameId ||
              element.findBy! === LocatorType.IFrameName
                ? "IFrameLocator"
                : "ILocator",
          })
        );
        continue;
      }
      if (element.type === "comment") {
        pageItems.push(""); // Add an empty line before comment
        pageItems.push(this._templateProvider.getComment(element.comment!));
      }
    }

    let pageBody = pageItems.join(EOL + EOL);
    pageBody = addIndent(pageBody, this._indentString);

    return this._templateProvider.getPage(
      this._outProjMeta.get(page.id)!.outputFileFullNamespace,
      this._outProjMeta.get(page.id)!.outputFileClassName,
      page.description || "",
      pageBody
    );
  }

  private generateTestSuiteFile(testSuite: ITestSuite, testcases: ITestCase[]) {
    const testcaseMethods: string[] = [];
    const usingDirectives: string[] = [];

    for (let testcaseId of testSuite.testcases) {
      let testcase = testcases.find((tc) => tc.id === testcaseId);
      if (!testcase) {
        throw new Error("DEV ERROR: cannot find testcase with id: " + testcaseId);
      }

      let fullNamespace = this._outProjMeta.get(testcase.id)!.outputFileFullNamespace;

      let usingDirective = `using ${fullNamespace};`;
      if (!usingDirectives.includes(usingDirective)) {
        usingDirectives.push(usingDirective);
      }

      let testcaseFunction = this.generateTestCaseFunction(testcase);
      testcaseMethods.push(testcaseFunction);
    }
    let usings = usingDirectives.join(EOL);
    let classBody = testcaseMethods.join(EOL + EOL);

    // Indent test method body with 1 indent;
    classBody = addIndent(classBody, this._indentString);

    let testClass = this._templateProvider.getTestSuiteFile(
      usings,
      this._outProjMeta.get(testSuite.id)!.outputFileClassName,
      testSuite.description,
      classBody,
      this._rootNamespace,
      this._outProjMeta.get(testSuite.id)!.outputFileFullNamespace
    );
    return testClass;
  }

  private generateTestCaseFile(testCase: ITestCase, pages: IPage[], routines: ITestRoutine[]) {
    const testcaseBody = this.generateTestCaseBody(testCase, pages, routines);

    let testFile = this._templateProvider.getTestCaseFile(
      this._outProjMeta.get(testCase.id)!.outputFileClassName,
      testCase.description,
      testcaseBody,
      this._rootNamespace,
      this._outProjMeta.get(testCase.id)!.outputFileFullNamespace
    );
    return testFile;
  }

  private generateTestCaseFunction(testCase: ITestCase) {
    const testcaseName = this._outProjMeta.get(testCase.id)!.outputFileClassName;
    const testCaseMethod = this._templateProvider.getTestFunction(testcaseName, testCase.description);
    return testCaseMethod;
  }

  private generateTestRoutineClass(testRoutine: ITestRoutine, pages: IPage[], datasetInfo: IDataSetInfo) {
    const testRoutineBody = this.generateTestRoutineBody(testRoutine, pages, datasetInfo);

    // Output class name will be "{testRoutineClassName}{datasetName}";
    const testRoutineName = this._outProjMeta.get(testRoutine.id)!.outputFileClassName;
    const finalOutputClassName = `${testRoutineName}${datasetInfo.name}`;

    let routineFileContent = this._templateProvider.getTestRoutineClass(
      finalOutputClassName,
      testRoutine.description,
      testRoutineBody
    );

    return routineFileContent;
  }

  private generateTestRoutineFile(testRoutine: ITestRoutine, testRoutineClasses: string[]) {
    let routineFileContent = this._templateProvider.getTestRoutineFile(
      this._rootNamespace,
      this._outProjMeta.get(testRoutine.id)!.outputFileFullNamespace,
      testRoutineClasses
    );
    return routineFileContent;
  }
}
