import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })

  if (!token) {
    // Redirect unauthenticated users to sign-in page
    const signInUrl = request.nextUrl.clone()
    signInUrl.pathname = '/auth/signin'
    signInUrl.search = ''
    signInUrl.searchParams.set('callbackUrl', request.nextUrl.href)

    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/chat/:path*', '/billing/:path*', '/connections/:path*'],
}
