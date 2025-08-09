import type { Profile } from 'passport-discord';

/**
 * Represents a Discord authentication profile.
 * Contains the Discord user profile, access token, and optionally a refresh token.
 */
export interface DiscordAuthProfile {
  /**
   * Discord user profile returned by passport-discord.
   */
  profile: Profile;
  /**
   * OAuth2 access token for Discord API.
   */
  accessToken: string;
  /**
   * Optional OAuth2 refresh token for Discord API.
   */
  refreshToken?: string;
}
