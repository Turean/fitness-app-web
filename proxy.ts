import { NextResponse, type NextRequest } from "next/server"

const AUTH_PAGES = ["/login", "/register"]

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl
    const signedIn = request.cookies.has("token")

    if (pathname === "/signout") {
        return NextResponse.next()
    }

    if (AUTH_PAGES.includes(pathname)) {
        return signedIn ? redirectTo("/", request) : NextResponse.next()
    }

    return signedIn ? NextResponse.next() : redirectTo("/login", request)
}

function redirectTo(path: string, request: NextRequest) {
    return NextResponse.redirect(new URL(path, request.url))
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
