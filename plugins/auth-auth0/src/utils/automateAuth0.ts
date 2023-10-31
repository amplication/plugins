import { ManagementClient } from "auth0";

export interface IAuth0Environment {
  clientID: string;
  clientSecret: string;
  audience: string;
  issuerURL: string;
}

export interface IAuth0EnvironmentOptions {
  identifier: string;
  jwtToken: string;
  clientName?: string;
  apiName?: string;
  audience?: string;
  actionName?: string;
}

export const setupAuth0Environment = async ({
  identifier,
  jwtToken,
  clientName = "Amplication SPA",
  apiName = "Amplication API",
  audience = "http://localjost:3001",
  actionName = "Add user details to user response",
}: IAuth0EnvironmentOptions): Promise<IAuth0Environment | undefined> => {
  // Identifer is of the form https://<tenant>.<region>.auth0.com/api/v2/
  // Need to extract the domain of form <tenant>.<region>.auth0.com
  const domain = identifier.split("/")[2];

  const management = new ManagementClient({
    domain,
    token: jwtToken,
  });

  try {
    // Try to find the SPA client by name and create it if it doesn't exist
    const clients = await management.clients.getAll();
    let client = clients.data.find((client) => client.name === clientName);
    if (!client) {
      console.log("Creating SPA client");
      client = await management.clients
        .create({
          name: clientName,
          app_type: "spa",
          callbacks: ["http://localhost:3001/auth-callback"],
          allowed_logout_urls: ["http://localhost:3001/logout"],
          web_origins: ["http://localhost:3001"],
        })
        .then((response) => response.data);

      if (!client) {
        throw new Error("Failed to create SPA client");
      }
    } else {
      console.log("SPA client already exists");
    }

    // Try to find the API by name and create it if it doesn't exist
    const apis = await management.resourceServers.getAll();
    let api = apis.data.find((api) => api.name === apiName);
    if (!api) {
      console.log("Creating API");
      api = await management.resourceServers
        .create({
          name: "Amplication API",
          identifier: audience,
        })
        .then((response) => response.data);
    } else {
      console.log("API already exists");
    }

    // Try to find the action by name and create it if it doesn't exist
    const actions = await management.actions.getAll();
    let action = actions.data.actions.find(
      (action) => action.name === actionName,
    );
    if (!action) {
      console.log("Creating action");
      action = await management.actions
        .create({
          name: actionName,
          code: `
        /**
         * Handler that will be called during the execution of a PostLogin flow.
         *
         * @param {Event} event - Details about the user and the context in which they are logging in.
         * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
         */
        exports.onExecutePostLogin = async (event, api) => {
          if (event.authorization) {
            // Set claims 
            api.accessToken.setCustomClaim('user', event.user);
          }
        };
        `,
          supported_triggers: [
            {
              id: "post-login",
              version: "v2",
            },
          ],
          runtime: "node18",
        })
        .then((response) => response.data);

      if (!action) {
        throw new Error("Failed to create action");
      }

      // Deploy action
      await management.actions.deploy({
        id: action?.id,
      });
    } else {
      console.log("Action already exists");
    }

    // Add action to post-login flow
    await management.actions.updateTriggerBindings(
      {
        triggerId: "post-login",
      },
      {
        bindings: [
          {
            display_name: actionName,
            ref: {
              type: "action_id",
              value: action.id,
            },
          },
        ],
      },
    );

    return {
      clientID: client.client_id,
      clientSecret: client.client_secret,
      audience,
      issuerURL: `https://${domain}/`,
    };
  } catch (error) {
    console.error(error);
  }
};
