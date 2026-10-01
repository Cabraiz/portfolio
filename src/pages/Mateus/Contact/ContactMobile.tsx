import { localizeLabel, useLabelLanguage } from '@/i18n/labels';
import { type FC } from "react";
import { Image } from "react-bootstrap";

import perfil from "../../../assets/Mateus/perfil.webp";
import styles from "./ContactMobile.module.css";

const CONTACT_ITEMS = [
  "mateus@email.com",
  "+55 (11) 91234-5678",
  "LinkedIn: /mateuscabraiz",
  "GitHub: /cabraiz",
] as const;

const ContactMobile: FC = () => {
  useLabelLanguage();
  return (
    <div className={styles.root} data-mobile-contact="true">
      <div className={styles.profileFrame}>
        <Image
          src={perfil}
          roundedCircle
          loading="lazy"
          className={styles.profileImage}
          alt={localizeLabel("Mateus Cabraiz")}
        />
      </div>

      <h1 className={styles.name}>{localizeLabel("Mateus Cabraiz")}</h1>

      <div className={styles.contactList}>
        {CONTACT_ITEMS.map((item) => (
          <div key={item} className={styles.contactItem}>
            {localizeLabel(item)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactMobile;
