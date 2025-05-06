import { useEffect } from "react";

interface TitleWebsiteProps {
  title1: string;
  title2: string;
}

function TitleWebsite({ title1, title2 }: TitleWebsiteProps) {
  useEffect(() => {
    document.title = title1;

    const handleVisibilityChange = () => {
      document.title = document.hidden ? title2 : title1;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [title1, title2]);

  return null; // nada a renderizar, pois só cuida do título
}

export default TitleWebsite;
