import React, { useEffect } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";

interface TitleWebsiteProps {
  title1: string;
  title2: string;
}

function TitleWebsite({ title1, title2 }: TitleWebsiteProps) {
  useEffect(() => {
    const visibilityChangeListener = () => {
      document.title = document.hidden ? title2 : title1;
    };

    document.addEventListener("visibilitychange", visibilityChangeListener);

    return () => {
      document.removeEventListener("visibilitychange", visibilityChangeListener);
    };
  }, [title1, title2]);

  return (
    <HelmetProvider>
      <Helmet>
        <title>{title1}</title>
      </Helmet>
    </HelmetProvider>
  );
}

export default TitleWebsite;
