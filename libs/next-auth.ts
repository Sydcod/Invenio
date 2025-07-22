import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import config from "@/config";
import connectMongo from "./mongo";
import connectMongoose from "./mongoose";
import User from "@/models/User";

interface NextAuthOptionsExtended extends NextAuthOptions {
  adapter: any;
}

export const authOptions: NextAuthOptionsExtended = {
  // Set any random key in .env.local
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      // Follow the "Login with Google" tutorial to get your credentials
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      async profile(profile) {
        return {
          id: profile.sub,
          name: profile.given_name ? profile.given_name : profile.name,
          email: profile.email,
          image: profile.picture,
          createdAt: new Date(),
        };
      },
    }),
    // Follow the "Login with Email" tutorial to set up your email server
    // Requires a MongoDB database. Set MONOGODB_URI env variable.
    ...(connectMongo
      ? [
          EmailProvider({
            server: {
              host: "smtp.resend.com",
              port: 465,
              auth: {
                user: "resend",
                pass: process.env.RESEND_API_KEY,
              },
            },
            from: config.resend.fromNoReply,
          }),
        ]
      : []),
  ],
  // New users will be saved in Database (MongoDB Atlas). Each user (model) has some fields like name, email, image, etc..
  // Requires a MongoDB database. Set MONOGODB_URI env variable.
  // Learn more about the model type: https://next-auth.js.org/v3/adapters/models
  ...(connectMongo && { adapter: MongoDBAdapter(connectMongo) }),

  callbacks: {
    signIn: async ({ user, account, profile }) => {
      // MINIMAL SOLUTION: Let NextAuth handle user creation automatically
      // This fixes the OAuth login issue by allowing NextAuth's MongoDB adapter
      // to create users with the simple schema it expects
      
      // The custom user creation logic has been commented out to prevent conflicts
      // Users will be created with basic fields: name, email, image, emailVerified
      
      return true;
      
      /* COMMENTED OUT - Custom user creation was causing OAuth login issues
      if (account?.provider === "google") {
        try {
          await connectMongoose();
          
          // Check if user exists
          let existingUser = await User.findOne({ email: user.email });
          
          if (!existingUser) {
            // Create new user with proper schema structure
            existingUser = await User.create({
              email: user.email,
              name: user.name,
              image: user.image,
              role: {
                name: 'admin', // All users are admins by default
                permissions: [
                  'canManageUsers',
                  'canManageInventory',
                  'canManageSales',
                  'canManagePurchases',
                  'canManageReports',
                  'canViewReports',
                  'canManageSettings'
                ],
                customPermissions: {
                  inventory: { view: true, create: true, edit: true, delete: true },
                  sales: { view: true, create: true, edit: true, delete: true, approve: true },
                  purchases: { view: true, create: true, edit: true, delete: true, approve: true },
                  reports: { view: true, export: true, advanced: true },
                  settings: { view: true, edit: true, users: true, billing: true }
                }
              },
              status: 'pending',
              preferences: {
                language: 'en',
                theme: 'auto',
                notifications: {
                  email: true,
                  browser: true,
                  lowStock: true,
                  orderUpdates: true,
                  systemAlerts: true
                },
                dashboard: {
                  widgets: ['inventory-summary', 'recent-orders', 'low-stock-alerts'],
                  defaultView: 'overview'
                }
              }
            });
          }
          
          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return true;
      */
    },
    jwt: async ({ token, user, trigger, session }) => {
      // Initial sign in
      if (user) {
        try {
          await connectMongoose();
          const dbUser = await User.findOne({ email: user.email });
          if (dbUser) {
            token.userId = dbUser._id.toString();
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error('Error in JWT callback:', error);
        }
      }
      
      // Update token if user data changes
      if (trigger === "update" && session) {
        try {
          await connectMongoose();
          const dbUser = await User.findById(token.userId);
          if (dbUser) {
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error('Error updating token:', error);
        }
      }
      
      return token;
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.sub;
        session.user.userId = token.userId as string;
        session.user.role = token.role as any;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  theme: {
    brandColor: config.colors.main,
    // Add you own logo below. Recommended size is rectangle (i.e. 200x50px) and show your logo + name.
    // It will be used in the login flow to display your logo. If you don't add it, it will look faded.
    logo: `/icon.png`, // Using the icon from the app root
  },
};

export default NextAuth(authOptions);
