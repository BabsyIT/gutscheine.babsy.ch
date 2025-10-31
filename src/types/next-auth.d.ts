import { UserRole, AuthMethod, BabsyUserType } from "@prisma/client"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      authMethod: AuthMethod
      babsyUserType: BabsyUserType | null
    } & DefaultSession["user"]
  }
}
