import React, { useEffect, useState } from "react";
import { Admin, DataProvider, Resource } from "react-admin";
import buildGraphQLProvider from "./data-provider/graphqlDataProvider";
import { theme } from "./theme/theme";
import Login from "./Login";
import "./App.scss";
import Dashboard from "./pages/Dashboard";
import { createBrowserHistory as createHistory } from "history";
import { BrowserRouter } from "react-router-dom";
import { samlAuthProvider } from "./auth-provider/ra-auth-saml";

declare const RESOURCES: React.ReactElement[];
declare const RESOURCE_NAME = "my resource name";

const history = createHistory();

const App = (): React.ReactElement => {
  const [dataProvider, setDataProvider] = useState<DataProvider | null>(null);
  useEffect(() => {
    buildGraphQLProvider
      .then((provider: DataProvider) => {
        setDataProvider(() => provider);
      })
      .catch((error: unknown) => {
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
          authProvider={samlAuthProvider}
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
