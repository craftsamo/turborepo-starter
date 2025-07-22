/**
 * Represents a local authentication profile.
 */
export interface LocalAuthProfile {
  /**
   * Unique identifier for the user.
   */
  uid: string;

  /**
   * Username of the user.
   */
  username: string;

  /**
   * Email address of the user.
   */
  email: string;
}
