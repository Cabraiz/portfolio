import React from "react";
import { render, screen, within } from "@testing-library/react";
import Mateus, { capitalizeFirstLetter, getSocialMediaName } from "./Mateus";

describe("Componente Mateus", () => {
  test("renderiza corretamente o texto de cargo", () => {
    render(<Mateus />);
    const cargoText = screen.getByText(/Full Stack Developer/i);
    expect(cargoText).toBeInTheDocument();
  });

  test("renderiza corretamente o texto de boas-vindas", () => {
    render(<Mateus />);
    const boasVindasText = screen.getByText(/Hey there! Welcome to my website/i);
    expect(boasVindasText).toBeInTheDocument();
  });

  test("renderiza a imagem de perfil com atributo alt", () => {
    render(<Mateus />);
    const profileImage = screen.getByAltText("Profile Image");
    expect(profileImage).toBeInTheDocument();
  });

  test("renderiza ícones de redes sociais com links válidos", () => {
    render(<Mateus />);

    const socialLinks = [
      "https://www.linkedin.com/in/cabraiz/",
      "mailto:mateusccabr@gmail.com?subject=Freelance%20Job%20Opportunity%20for%20Developer%20Engineer&body=Dear%20Cabral%2C%0D%0A%0D%0AWe%20came%20across%20your%20profile%20and%20our%20company%20is%20looking%20for%20a%20freelance%20developer%20engineer%20to%20work%20on%20a%20project%20that%20involves%20%5Bbriefly%20mention%20the%20project%20or%20technology%20stack%5D.%0D%0A%0D%0AIf%20you%20are%20interested%20in%20this%20opportunity%2C%20please%20let%20us%20know%20and%20we%20can%20discuss%20the%20details%20further.%0D%0A%0D%0AThank%20you%20for%20your%20time%20and%20consideration.%0D%0A%0D%0ABest%20regards%2C%0D%0A%5BCompany%20Name%5D",
      "https://www.instagram.com/cabraiz/",
      "https://www.tiktok.com/@cabraiz"
    ];

    const socialIcons = screen.queryAllByRole("button", { name: /Social Icon/i });
    expect(socialIcons).toHaveLength(4);

    socialIcons.forEach((icon, index) => {
      expect(icon).toHaveAttribute("href", socialLinks[index]);

      const img = within(icon).getByRole("img");
      expect(img).toHaveAttribute("src", `Icon${capitalizeFirstLetter(getSocialMediaName(index))}.png`);
    });
  });
});