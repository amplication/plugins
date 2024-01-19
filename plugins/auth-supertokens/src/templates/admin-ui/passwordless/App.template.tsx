import React, { useEffect, useState } from "react";
import { Admin, DataProvider, Resource } from "react-admin";
import buildGraphQLProvider from "./data-provider/graphqlDataProvider";
import { Route } from "react-router-dom";
import { theme } from "./theme/theme";
import Login from "./Login";
import "./App.scss";
import Dashboard from "./pages/Dashboard";
import { supertokensAuthProvider } from "./auth-provider/ra-auth-supertokens";
import SuperTokens from "supertokens-web-js";
import { SuperTokensConfig } from "./config";
import ConsumeSuperTokensMagicLink from "./ConsumeSuperTokensMagicLink";

declare const AUTH_PROVIDER_NAME: any;
declare const RESOURCES: React.ReactElement[];
declare const RESOURCE_NAME = "my resource name";

SuperTokens.init(SuperTokensConfig);

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
      <Admin
        title={RESOURCE_NAME}
        dataProvider={dataProvider}
        authProvider={supertokensAuthProvider}
        theme={theme}
        dashboard={Dashboard}
        loginPage={Login}
        history={history}
        customRoutes={[
          <Route
            exact
            path="/auth/verify"
            component={ConsumeSuperTokensMagicLink}
          />,
        ]}
      >
        {RESOURCES}
      </Admin>
    </div>
  );
};

export default App;
