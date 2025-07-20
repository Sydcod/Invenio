import NextAuth, { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's id from NextAuth */
      id: string;
      /** The user's MongoDB ObjectId */
      userId: string;
      /** The user's role with permissions */
      role: {
        name: 'owner' | 'admin' | 'manager' | 'staff' | 'viewer';
        permissions: {
          canManageOrganization: boolean;
          canManageUsers: boolean;
          canManageInventory: boolean;
          canManageSales: boolean;
          canManagePurchases: boolean;
          canManageReports: boolean;
          canViewReports: boolean;
          canManageSettings: boolean;
          custom: {
            inventory: string[];
            sales: string[];
            purchases: string[];
            reports: string[];
            settings: string[];
          };
        };
      };
    } & DefaultSession['user'];
  }
  
  interface User {
    id: string;
    role?: any;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    role?: any;
  }
}
