import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { APP_SITE, isPackagedApp, openExternal } from "@/lib/app-downloads";

/** Feedback entry point. In the installed apps (Android/Windows) the local
 *  feedback form is disabled — feedback is sent only from the website, so this
 *  opens the site's /feedback page in the system browser instead. */
export function FeedbackLink(props: React.ComponentProps<typeof Link>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const packaged = mounted && isPackagedApp();

  return (
    <Link
      {...props}
      onClick={(e) => {
        if (packaged) {
          e.preventDefault();
          void openExternal(`${APP_SITE}/feedback`);
        } else {
          props.onClick?.(e);
        }
      }}
    />
  );
}
