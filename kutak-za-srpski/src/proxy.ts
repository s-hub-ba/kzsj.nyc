import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all paths except api routes, admin routes, Next.js internals and static files
    "/((?!api|admin|_next|_vercel|firebase-messaging-sw\\.js|.*\\..*).*)",
  ],
};
