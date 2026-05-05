
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Session'ı kontrol et
  const { data: { session } } = await supabase.auth.getSession()

  // Korumalı route'lar
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isCustomerProfileRoute = request.nextUrl.pathname.startsWith('/customer/profile')
  const isCustomerOrdersRoute = request.nextUrl.pathname.startsWith('/customer/orders')

  // Auth gerektiren sayfalar
  if (isAdminRoute || isCustomerProfileRoute || isCustomerOrdersRoute) {
    if (!session) {
      const redirectUrl = new URL('/customer/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/customer/profile/:path*',
    '/customer/orders/:path*',
  ],
}