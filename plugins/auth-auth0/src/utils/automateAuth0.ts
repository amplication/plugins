import { BuildLogger } from "@amplication/code-gen-types";
import { ManagementClient } from "auth0";

export interface IAuth0Environment {
  clientID: string;
  clientSecret: string;
  audience: string;
  issuerURL: string;  
  domain: string;
}

export interface IAuth0EnvironmentOptions {
  identifier: string;
  jwtToken: string;
  clientName?: string;
  apiName?: string;
  audience?: string;
  actionName?: string;
  logger: BuildLogger;
}

export class Auth0Environment implements IAuth0Environment {
  private static instance: Auth0Environment | undefined;

  private constructor(
    public readonly clientID: string,
    public readonly clientSecret: string,
    public readonly audience: string,
    public readonly issuerURL: string,
    public readonly domain: string,
  ) {}

  public static async getInstance(
    options: IAuth0EnvironmentOptions,
  ): Promise<IAuth0Environment> {
    if (!Auth0Environment.instance) {
      const environment = await setupAuth0Environment(options);
      if (!environment) {
        throw new Error("Failed to create Auth0 environment");
      }

      Auth0Environment.instance = new Auth0Environment(
        environment.clientID,
        environment.clientSecret,
        environment.audience,
        environment.issuerURL,
        environment.domain,
      );
    }
    return Auth0Environment.instance;
  }

  public static async resetInstance(): Promise<void> {
    Auth0Environment.instance = undefined;
  }
}

async function setupAuth0Environment({
  identifier,
  jwtToken,
  clientName = "Amplication SPA",
  apiName = "Amplication API",
  audience = "http://localhost:3001",
  actionName = "Add user details to user response",
  logger,
}: IAuth0EnvironmentOptions): Promise<IAuth0Environment | undefined> {
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
      logger.info("Creating SPA client");
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
      logger.info("SPA client already exists");
    }

    // Try to find the API by name and create it if it doesn't exist
    const apis = await management.resourceServers.getAll();
    let api = apis.data.find((api) => api.name === apiName);
    if (!api) {
      logger.info("Creating API");
      api = await management.resourceServers
        .create({
          name: "Amplication API",
          identifier: audience,
          signing_alg: "RS256",
        })
        .then((response) => response.data);
    } else {
      logger.info("API already exists");
    }

    // Try to find the action by name and create it if it doesn't exist
    const actions = await management.actions.getAll();
    let action = actions.data.actions.find(
      (action) => action.name === actionName,
    );
    if (!action) {
      logger.info("Creating action");
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
      logger.info("Action already exists");
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
      domain,
    };
  } catch (error) {
    logger.error((error as Error).message);
    throw error;
  }
}
