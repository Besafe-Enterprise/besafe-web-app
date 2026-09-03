import { type NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const agencyToken = request.cookies.get("agencyAccessToken")?.value

  // 1. Redirect legacy /dashboard routes to /operations
  if (pathname.startsWith("/dashboard")) {
    const target = "/operations" + pathname.slice("/dashboard".length)
    return NextResponse.redirect(new URL(target, request.url))
  }

  // 2. If authenticated agency user tries to access /login or /register, redirect to /operations
  if (pathname === "/login" || pathname === "/register") {
    if (agencyToken) {
      return NextResponse.redirect(new URL("/operations", request.url))
    }
    return NextResponse.next()
  }

  // 3. Protected Operations Console (Agency Admin role)
  if (pathname.startsWith("/operations")) {
    if (!agencyToken) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // 4. Protected Field Worker Console (staff + admin roles)
  if (pathname.startsWith("/field")) {
    if (!agencyToken) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/operations/:path*", "/field/:path*", "/login", "/register"],
}
