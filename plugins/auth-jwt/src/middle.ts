import { NextFunction } from "express";
import { AuthServicePlaceholderService } from "../authServicePlaceholder/authServicePlaceholder.service";
import { Injectable, NestMiddleware } from "@nestjs/common";
import * as jwt from "jsonwebtoken";

@Injectable()
export class UserValidateActiveDirectory implements NestMiddleware {
  constructor(private userService: AuthServicePlaceholderService) {}

  async use(req: any, res: any, next: NextFunction) {
    try {
      // Extract the token from the Authorization header
      const authHeader = req.headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send({
          status: "error",
          text: "Authorization header is missing or invalid",
        });
      }
      const token = authHeader.split(" ")[1]; // Remove "Bearer " prefix
      try {
        // Decode the token without verification (this assumes you're not verifying the signature here)
        const decodedToken = jwt.decode(token) as { tokenFieldName?: string };
        res.tokenFieldName = (decodedToken as any)["cognito:username"];
        const loginUser = await this.userService.authServicePlaceholder({
          where: { authEntityFieldName: res.tokenFieldName },
        });
        if (loginUser) {
          req.user = loginUser;
          next();
        } else {
          res.send({
            status: "error",
            text: "user with the given tokenFieldName does not exist",
          });
        }
      } catch (error) {
        // Handle errors (e.g., invalid token)
        console.error("Error decoding token:", error);
        return null;
      }
    } catch (error) {
      console.error("Error in middleware:", error);
      res
        .status(500)
        .send({ status: "error", text: "Internal server error", error });
    }
  }
}
