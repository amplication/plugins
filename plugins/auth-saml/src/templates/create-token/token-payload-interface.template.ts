declare class ID_TYPE {}

export interface ITokenPayload {
  id: ID_TYPE;
  username: string;
  sessionId: string;
}

export interface ITokenService {
  createToken: ({ id, username, sessionId }: ITokenPayload) => Promise<string>;
}
