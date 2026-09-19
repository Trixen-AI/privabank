import type { AnchorHTMLAttributes } from "react";
import { Link } from "react-router";

/**
 * Site links point at on-page anchors (#papers) or into the app (/app/...).
 * App routes go through the router so opening the dashboard is a client-side
 * navigation; everything else stays a plain anchor.
 */
export function SmartLink({ href = "", ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href.startsWith("/")) return <Link to={href} {...rest} />;
  return <a href={href} {...rest} />;
}
