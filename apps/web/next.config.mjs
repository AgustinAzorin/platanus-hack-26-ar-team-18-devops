import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace TS packages — Next must transpile them since we ship .ts directly.
  transpilePackages: ['@repo/types'],
  // Critical for monorepos: tells Next to trace files from the repo root, not
  // just apps/web. Without this, builds fail with "Module not found" or
  // "Failed to load files outside Next.js root" for workspace packages.
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
