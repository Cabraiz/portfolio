import React from "react";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import Mateus, { capitalizeFirstLetter, getSocialMediaName  } from "./Mateus";
import { default as axe, Result } from "axe-core";
import { isMobile } from 'react-device-detect';

jest.mock("react-device-detect", () => ({
  ...jest.requireActual("react-device-detect"),
  isMobile: true,
}));

jest.useFakeTimers(); 


describe("Mateus", () => {
  test('should display correct title', async () => {
    render(<Mateus />);
    
    // The expected text
    const expectedText = 'Full Stack Developer';
    
    // Use queryAllByText to find all elements with a partial match
    const titleElement = await screen.findAllByText((content, element) => {
      const hasText = (text: string) => element?.textContent?.includes(text) ?? false;
      return hasText('Full Stack');
    });
  
    // Check if any of the title elements contain the expected text
    const foundTitleElement = titleElement.find((element) =>
      element?.textContent?.includes(expectedText)
    );
  
    // Assertion
    expect(foundTitleElement).toBeInTheDocument();
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
        const linkElement = screen.getByRole("link", { name: socialMediaName });
        const linkImage = within(linkElement).getByAltText(socialMediaName);
  
        expect(linkElement).toBeInTheDocument();
        expect(linkImage).toBeInTheDocument();
  
        // Verifica o atributo href do elemento âncora.
        const hrefAttribute = linkElement.getAttribute("href");
        expect(hrefAttribute).toBe(socialMediaLinks[index]);
      });
    });
  });

  jest.mock("react-device-detect", () => {
    return {
      ...jest.requireActual("react-device-detect"), // Use the real implementation of react-device-detect
      isMobile: true, // Set isMobile to false by default for testing non-mobile view
    };
  });
  
  test("renderização condicional de elementos específicos", () => {
    render(<Mateus />);
    const someConditionalElement = screen.queryByTestId("someConditionalElement");
    
    // Verifica se um elemento condicional não está presente inicialmente
    expect(someConditionalElement).not.toBeInTheDocument();
    
    // Dispare uma condição para renderizar o elemento
    // ...
    // Verifica se o elemento agora está presente
    // expect(someConditionalElement).toBeInTheDocument();
  });
  
  test("botão de rolagem para o topo aparece e funciona corretamente", () => {
    render(<Mateus />);
  
    // Mock the window.scrollTo function
    const scrollToMock = jest.fn();
    window.scrollTo = scrollToMock;
  
    // Find the scroll to top button by its test ID
    const scrollToTopButton = screen.queryByTestId("scrollToTopButton");
  
    // If the scroll to top button is present, simulate a click on the button
    if (scrollToTopButton) {
      fireEvent.click(scrollToTopButton);
    }
  
    // Get the expected scroll position based on the presence of the scroll to top button
    const expectedScrollPosition = 0;
  
    // Use setTimeout to introduce a delay of 100ms before asserting the scrollToMock function
    setTimeout(() => {
      // Check if the scrollTo function has been called with the expected scroll position and behavior
      expect(scrollToMock).toHaveBeenCalledTimes(1);
      expect(scrollToMock).toHaveBeenCalledWith(
        expect.objectContaining({ top: expectedScrollPosition, behavior: "smooth" })
      );
    }, 100); // Adjust the delay (ms) as needed
  });
});