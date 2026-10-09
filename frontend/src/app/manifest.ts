import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Yuno920",
    short_name: "Yuno920",
    description: "아이의 작은 순간을 기록하고 함께 성장하는 가족 공간",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fffaf3",
    theme_color: "#f97316",
    icons: [{
      src: "/icon",
      sizes: "32x32",
      type: "image/png",
    }],
  };
}
