import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/requests/:path*',
    '/approvals/:path*',
    '/admin/:path*',
    '/api/requests/:path*',
    '/api/balances/:path*',
    '/api/time-entries/:path*',
    '/api/reports/:path*',
  ]
}