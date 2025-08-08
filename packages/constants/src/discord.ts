export const DISCORD_DOMAIN = `discordapp.com` as const;
export const DISCORD_ENDPOINT = `https://${DISCORD_DOMAIN}` as const;
export const DISCORD_API_ENDPOINT = `https://${DISCORD_DOMAIN}/api/v9` as const;
export const DISCORD_CDN_ENDPOINT = `https://cdn.${DISCORD_DOMAIN}` as const;
