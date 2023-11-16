export interface Settings {
  /**
   * The Secrets Provider reference for the jwt secret key used to sign the JWT token.
   * i.e. for the basic secrets provider (env variables), this would be the name of the environment variable containg the JWT Secret Key.
   */
  JwtSecretKeyReference: string;
}
