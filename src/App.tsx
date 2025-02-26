import { useEffect, useState } from "react";
import { Hub } from "aws-amplify/utils";
import {
  signInWithRedirect,
  signOut,
  getCurrentUser,
  AuthUser,
  fetchUserAttributes,
} from "aws-amplify/auth";
import { Button } from "@/components/ui/button";
import { Amplify, ResourcesConfig } from "aws-amplify";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const authConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN,
          scopes: [
            "openid",
            "email",
            "phone",
            "profile",
            "aws.cognito.signin.user.admin",
          ],
          redirectSignIn: [import.meta.env.VITE_REDIRECT_SIGNIN],
          redirectSignOut: [import.meta.env.VITE_REDIRECT_SIGNOUT],
          responseType: "token",
        },
      },
    },
  },
};

Amplify.configure(authConfig);

interface UserProfile {
  sub: string;
  email?: string;
  email_verified?: string;
  family_name?: string;
  given_name?: string;
  profile?: string;
  phone_number?: string;
  identities?: string;
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      switch (payload.event) {
        case "signInWithRedirect":
          getUser();
          break;
        case "signInWithRedirect_failure":
          setError("An error has occurred during the OAuth flow.");
          break;
      }
    });

    getUser();

    return unsubscribe;
  }, []);

  const getUser = async (): Promise<void> => {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      setUser(currentUser);
      setUserProfile({
        sub: currentUser.userId,
        email: attributes.email,
        family_name: attributes.family_name,
        given_name: attributes.given_name,
        profile: attributes.profile,
        phone_number: attributes.phone_number,
      });
    } catch (error) {
      console.error(error);
      console.log("Not signed in");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {!user ? (
        <div className="space-y-4">
          <Button
            onClick={() =>
              signInWithRedirect({
                provider: "Google",
                customState: "/",
              })
            }
            className="w-full"
          >
            Sign in with Google
          </Button>
          {error && <p className="text-red-500">{error}</p>}
        </div>
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userProfile?.profile} alt="Profile" />
                <AvatarFallback>
                  {userProfile?.given_name?.charAt(0)}
                  {userProfile?.family_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-xl font-semibold">
                  {userProfile?.given_name} {userProfile?.family_name}
                </h2>
                {userProfile?.email && (
                  <p className="text-gray-600">{userProfile.email}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {userProfile?.phone_number && (
                <p className="text-sm">
                  <span className="font-medium">Phone:</span>{" "}
                  {userProfile.phone_number}
                </p>
              )}
              <p className="text-sm">
                <span className="font-medium">Username:</span> {user.username}
              </p>
              <p className="text-sm">
                <span className="font-medium">User ID:</span> {userProfile?.sub}
              </p>
            </div>

            <Button
              onClick={() => signOut()}
              variant="destructive"
              className="w-full"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
