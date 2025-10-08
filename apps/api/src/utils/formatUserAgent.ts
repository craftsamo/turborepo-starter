export const AGENTS: string[] = [
  'Chrome',
  'Firefox',
  'Safari',
  'Edge',
  'OPR',
  'Python-Requests',
  'Python',
  'Curl',
  'Postman',
  'Axios',
  'Node-Fetch',
  'Insomnia',
  'Googlebot',
  'Bingbot',
  'Twitterbot',
] as const;

export function formatUserAgent(userAgent?: string | null, agents = AGENTS) {
  if (!userAgent) return 'Unknown';
  for (const agent of agents) {
    const match = userAgent.match(new RegExp(`${agent}/(\\d+)`));
    if (match) {
      return `${agent} ${match[1]}`;
    }
  }
  return userAgent.split(' ')[0];
}
