import { auth } from "@/auth"
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from "next/server"
import { locales } from './i18n';
import type { NextRequest } from 'next/server';

// Create the i18n middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'de',
  localePrefix: 'as-needed'
});

// Combine auth and i18n middleware
export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Remove locale prefix for route checking
  const pathnameWithoutLocale = pathname.replace(/^\/(de|en)/, '') || '/'

  // Protected routes
  const isPartnerRoute = pathnameWithoutLocale.startsWith('/partner')
  const isAdminRoute = pathnameWithoutLocale.startsWith('/admin')

  // Redirect to signin if not authenticated
  if ((isPartnerRoute || isAdminRoute) && !isLoggedIn) {
    const locale = pathname.startsWith('/de') ? '/de' : pathname.startsWith('/en') ? '/en' : ''
    return NextResponse.redirect(new URL(`${locale}/auth/signin`, req.url))
  }

  // Check roles
  if (isPartnerRoute && req.auth?.user?.role !== 'PARTNER' && req.auth?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (isAdminRoute && req.auth?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Apply i18n middleware
  return intlMiddleware(req as NextRequest)
})

export const config = {
  matcher: ['/', '/(de|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
}
