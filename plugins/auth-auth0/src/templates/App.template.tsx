import React, { useEffect, useState } from "react";
import { Admin, DataProvider, Resource } from "react-admin";
//@ts-ignore
import buildGraphQLProvider from "./data-provider/graphqlDataProvider";
//@ts-ignore
import { theme } from "./theme/theme";
//@ts-ignore
import Login from "./Login";
import "./App.scss";
//@ts-ignore
import Dashboard from "./pages/Dashboard";
import { createBrowserHistory as createHistory } from "history";
import { BrowserRouter } from "react-router-dom";

declare const AUTH_PROVIDER_NAME: any;
declare const RESOURCES: React.ReactElement[];
declare const RESOURCE_NAME = "my resource name";

const history = createHistory();

const App = (): React.ReactElement => {
  const [dataProvider, setDataProvider] = useState<DataProvider | null>(null);
  useEffect(() => {
    buildGraphQLProvider
      .then((provider: any) => {
        setDataProvider(() => provider);
      })
      .catch((error: any) => {
        console.log(error);
      });
  }, []);
  if (!dataProvider) {
    return <div>Loading</div>;
  }
  return (
    <div className="App">
      <BrowserRouter>
        <Admin
          history={history}
          title={RESOURCE_NAME}
          dataProvider={dataProvider}
          authProvider={AUTH_PROVIDER_NAME}
          theme={theme}
          dashboard={Dashboard}
          loginPage={Login}
        >
          {RESOURCES}
        </Admin>
      </BrowserRouter>
    </div>
  );
};

export default App;
