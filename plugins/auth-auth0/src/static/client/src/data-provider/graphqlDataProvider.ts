import buildGraphQLProvider from "ra-data-graphql-amplication";
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { client } from "../auth-provider/ra-auth-auth0";

const httpLink = createHttpLink({
  uri: `${process.env.REACT_APP_SERVER_URL}/graphql`,
});

// eslint-disable-next-line @typescript-eslint/naming-convention
const authLink = setContext(async (_, { headers }) => {
  const token = await client.getTokenSilently({
    authorizationParams: {
      audience: process.env.REACT_APP_AUTH0_AUDIENCE,
      scope: "openid profile email",
    },
  });

  return {
    headers: {
      ...headers,
      authorization: `Bearer ${token}`,
    },
  };
});

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: authLink.concat(httpLink),
});

export default buildGraphQLProvider({
  client: apolloClient,
});
