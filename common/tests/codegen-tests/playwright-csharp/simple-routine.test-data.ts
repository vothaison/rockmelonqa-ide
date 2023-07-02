import { LocatorType } from "../../../src/file-defs";
import { IConfig, IPage, ITestCase, ITestRoutine, ITestSuite } from "../../test-helpers/rm-project-spec.types";

export interface ITestData {
  pages: IPage[];
  testcases: ITestCase[];
  testsuites: ITestSuite[];
  testroutines: ITestRoutine[];
  configFiles: IConfig[];
}

export const simpleRoutineTestData: ITestData = {
  configFiles: [
    {
      name: "default",
      settings: [
        {
          name: "TestUser",
          value: "jim",
        },
        {
          name: "TestPassword",
          value: "xxx",
        },
        {
          name: "RememeberMe",
          value: "yes",
        },
        {
          name: "DelayMs",
          value: "2000",
        },
        {
          name: "TheUrl",
          value: "https://github.com/",
        },
        {
          name: "Attr",
          value: "name=Test",
        },
      ],
    },
    {
      name: "local",
      settings: [
        {
          name: "TestUser",
          value: "john",
        },
        {
          name: "TestPassword",
          value: "yyy",
        },
      ],
    },
  ],

  pages: [
    {
      id: "",
      name: "FillsScreen",
      description: "Fills page",
      elements: [
        {
          id: "",
          type: "pageElement",
          name: "name",
          findBy: LocatorType.Css,
          locator: "[name='name']",
          description: "Name",
        },
        {
          id: "",
          type: "pageElement",
          name: "street",
          findBy: LocatorType.Css,
          locator: "[name='street']",
          description: "Street",
        },
        {
          id: "",
          type: "pageElement",
          name: "district",
          findBy: LocatorType.Css,
          locator: "[name='district']",
          description: "District",
        },
        {
          id: "",
          type: "pageElement",
          name: "bio",
          findBy: LocatorType.Css,
          locator: "[name='bio']",
          description: "Bio",
        },
      ],
    },
  ],
  testcases: [
    {
      id: "",
      name: "fills",
      description: "Fills the values on Fills page",
      steps: [
        {
          id: "",
          type: "testStep",
          page: "",
          element: "",
          action: "GoToUrl",
          // Chechkout repo https://dev.azure.com/zapcentral/zap-forks/_git/playwright-test-pages and run the local website
          data: "http://localhost:3000/routines/fills.html",
        },
        {
          id: "",
          type: "testStep",
          page: "FillsScreen",
          element: "street",
          action: "Clear",
          data: "",
        },
        {
          id: "",
          type: "testStep",
          page: "FillsScreen",
          element: "district",
          action: "ClosePopup",
          data: "",
        },
        {
          id: "",
          type: "testStep",
          page: "FillsScreen",
          element: "district",
          action: "ClickPopup",
          data: "",
        },
        {
          id: "",
          type: "testStep",
          page: "",
          element: "",
          action: "ClosePopup",
          data: "",
        },
        {
          id: "",
          type: "testStep",
          page: "",
          element: "",
          action: "Delay",
          data: "2000",
        },
        {
          id: "",
          type: "testStep",
          page: "FillsScreen",
          element: "district",
          action: "Input",
          data: "ABC",
        },
        {
          id: "",
          type: "testStep",
          page: "FillsScreen",
          element: "district",
          action: "InputByCode",
          data: "string.Empty",
        },
        {
          id: "",
          type: "testStep",
          page: "",
          element: "",
          action: "RunCode",
          data: "await defs.FillsScreenPage.Name().SelectOptionAsync(EnvironmentSettings.TestUser);",
        },
        {
          id: "",
          type: "testStep",
          page: "FillsScreen",
          element: "district",
          action: "SelectOption",
          data: "ABC",
        },
        {
          id: "",
          type: "testStep",
          page: "FillsScreen",
          element: "district",
          action: "VerifyAttribute",
          data: "ABC=DEF",
        },
        {
          id: "",
          type: "testStep",
          page: "FillsScreen",
          element: "district",
          action: "VerifyHasText",
          data: "ABC",
        },
        {
          id: "",
          type: "testStep",
          page: "FillsScreen",
          element: "district",
          action: "VerifyHasValue",
          data: "ABC",
        },
        {
          id: "",
          type: "testStep",
          page: "FillsScreen",
          element: "district",
          action: "VerifyIsEditable",
          data: "",
        },
        {
          id: "",
          type: "testStep",
          page: "FillsScreen",
          element: "district",
          action: "VerifyIsReadOnly",
          data: "",
        },
        {
          id: "",
          type: "testStep",
          page: "FillsScreen",
          element: "district",
          action: "VerifyIsHidden",
          data: "",
        },
        {
          id: "",
          type: "testStep",
          page: "FillsScreen",
          element: "district",
          action: "VerifyIsVisible",
          data: "",
        },
        {
          id: "",
          type: "testStep",
          page: "",
          element: "",
          action: "VerifyTitle",
          data: "TRZ",
        },
        {
          id: "",
          type: "testStep",
          page: "",
          element: "",
          action: "VerifyTitleContains",
          data: "nnn213gfhsd",
        },
        {
          id: "",
          type: "testStep",
          page: "",
          element: "",
          action: "VerifyUrl",
          data: "https://stackoverflow.com/",
        },
      ],
    },
  ],
  testroutines: [
    {
      id: "",
      name: "FillName",
      description: "Fill the name",
      steps: [
        {
          id: "",
          type: "testStep",
          page: "FillsScreen",
          element: "name",
          action: "Input",
          data: {
            "DataSet Number One": "John",
            "DataSet Number Two": "Jane",
            "DataSet Number Three": "Jim",
          },
        },
      ],
      dataSets: [
        {
          id: "",
          name: "DataSet Number One",
          description: "One One One",
        },
        {
          id: "",
          name: "DataSet Number Two",
          description: "Two Two Two",
        },
        {
          id: "",
          name: "DataSet Number Three",
          description: "Three Three Three",
        },
      ],
    },
    {
      id: "",
      name: "FillDistrictAndBio",
      description: "Fill the district and bio",
      steps: [
        {
          id: "",
          type: "testStep",
          page: "FillsScreen",
          element: "district",
          action: "Input",
          data: {
            "DS One": "Seven",
            "DS Two": "Eight",
          },
        },
        {
          id: "",
          type: "testStep",
          page: "FillsScreen",
          element: "bio",
          action: "Input",
          data: {
            "DS One": "Love Reading",
            "DS Two": "Playing Video games",
          },
        },
      ],
      dataSets: [
        {
          id: "",
          name: "DS One",
          description: "One One One",
        },
        {
          id: "",
          name: "DS Two",
          description: "Two Two Two",
        },
      ],
    },
  ],
  testsuites: [
    {
      id: "",
      name: "Fills",
      description: "Test for Fills",
      testcases: ["fills"],
    },
  ],
};
