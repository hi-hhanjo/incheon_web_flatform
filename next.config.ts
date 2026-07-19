import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "t1.daumcdn.net",
        pathname: "/media/img-section/sports13/logo/team/**",
      },
    ],
  },
};

export default nextConfig;
