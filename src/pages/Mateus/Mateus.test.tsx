import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import Mateus, { capitalizeFirstLetter, getSocialMediaName } from "./Mateus";

describe("Mateus", () => {
  test("título do trabalho correto", () => {
    render(<Mateus />);
    const tituloTrabalho = screen.getByText(/Full Stack Developer/i);
    expect(tituloTrabalho).toBeInTheDocument();
  });

  test("mensagem de boas-vindas correta", () => {
    render(<Mateus />);
    const mensagemBoasVindas = screen.getByText(/Hey there! Welcome to my website/i);
    expect(mensagemBoasVindas).toBeInTheDocument();
  });

  test("imagem de perfil com atributo alt", () => {
    render(<Mateus />);
    const imagemPerfil = screen.getByAltText("Profile Image");
    expect(imagemPerfil).toBeInTheDocument();
  });

  test("ícones de mídias sociais com links válidos", async () => {
    render(<Mateus />);
  
    const socialMediaLinks = [
      "https://www.linkedin.com/in/cabraiz/",
      "mailto:mateusccabr@gmail.com?subject=Freelance%20Job%20Opportunity%20for%20Developer%20Engineer&body=Dear%20Cabral%2C%0D%0A%0D%0AWe%20came%20across%20your%20profile%20and%20our%20company%20is%20looking%20for%20a%20freelance%20developer%20engineer%20to%20work%20on%20a%20project%20that%20involves%20%5Bbriefly%20mention%20the%20project%20or%20technology%20stack%5D.%0D%0A%0D%0AIf%20you%20are%20interested%20in%20this%20opportunity%2C%20please%20let%20us%20know%20and%20we%20can%20discuss%20the%20details%20further.%0D%0A%0D%0AThank%20you%20for%20your%20time%20and%20consideration.%0D%0A%0D%0ABest%20regards%2C%0D%0A%5BCompany%20Name%5D",
      "https://www.instagram.com/cabraiz/",
      "https://www.tiktok.com/@cabraiz",
    ];
  
    await waitFor(() => {
      const socialMediaIcons = screen.queryAllByAltText((content, element) =>
        ["LinkedIn", "Gmail", "Insta", "Tiktok"].includes(content) &&
        element?.tagName?.toLowerCase() === "img"
      );
  
      expect(socialMediaIcons).toHaveLength(socialMediaLinks.length);
  
      socialMediaIcons.forEach((icon, index) => {
        const socialMediaName = getSocialMediaName(index);
        const srcExpected = `Icon${capitalizeFirstLetter(socialMediaName)}.png`;
  
        expect(icon).toHaveAttribute("src", srcExpected);
        expect(icon).toHaveAttribute("alt", socialMediaName);
  
        // Encontra o elemento âncora com o papel "link".
        const linkElement = screen.getByRole("link", { name: socialMediaName });
  
        // Usa "within" para buscar a imagem dentro do elemento âncora.
        const linkImage = within(linkElement).getByAltText(socialMediaName);
  
        expect(linkElement).toBeInTheDocument();
        expect(linkImage).toBeInTheDocument();
  
        // Verifica o atributo href do elemento âncora.
        const hrefAttribute = linkElement.getAttribute("href");
        expect(hrefAttribute).toBe(socialMediaLinks[index]);
      });
    });
  });
});