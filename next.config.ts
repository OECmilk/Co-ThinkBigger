import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // クライアントルーターキャッシュの保持時間（秒）。
    // 既定値の dynamic: 0 だと、一度開いたステップに戻るたびに
    // サーバーへの再取得が走って毎回待たされる。
    // Server Action 側は revalidatePath を呼んでいるので、
    // 更新時はこのキャッシュも破棄され、古い内容は残らない。
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
