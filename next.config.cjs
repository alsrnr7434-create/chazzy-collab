/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // ESLint(코드 모양 검사) 무시
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TypeScript(타입 검사) 무시
  typescript: {
    ignoreBuildErrors: true,
  },
  // 서버 컴포넌트 외부 패키지 설정
  experimental: {
    serverComponentsExternalPackages: ['youtubei.js'],
  },
};

module.exports = nextConfig;