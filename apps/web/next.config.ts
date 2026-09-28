import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  agentRules: false,
  devIndicators: false,
  experimental: {
    useTypeScriptCli: false,
  },
  poweredByHeader: false,
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
