export type PublicUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type GoogleProfile = {
  providerAccountId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};
