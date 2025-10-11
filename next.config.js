/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ydmroqaiwgdmbtkiwtuq.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
         {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

module.exports = nextConfig
