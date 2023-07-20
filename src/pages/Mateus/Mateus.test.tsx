import React from "react";
import { render, screen } from "@testing-library/react";
import Mateus from "./Mateus";

describe("Mateus component", () => {
  test("should render 'Full Stack Developer' text", () => {
    render(<Mateus />);
    const fullStackText = screen.getByText(/Full Stack Developer/i);
    expect(fullStackText).toBeInTheDocument();
  });

  test("should render 'Hey there! Welcome to my website' text", () => {
    render(<Mateus />);
    const welcomeText = screen.getByText(/Hey there! Welcome to my website/i);
    expect(welcomeText).toBeInTheDocument();
  });

  test("should render profile image with alt attribute", () => {
    render(<Mateus />);
    const profileImage = screen.getByAltText("Profile Image");
    expect(profileImage).toBeInTheDocument();
  });

  test("should render social media icons with appropriate links", () => {
    render(<Mateus />);

    const socialIcons = screen.getAllByRole("img", { name: "Social Icon" });

    expect(socialIcons).toHaveLength(4);
    expect(socialIcons[0]).toHaveAttribute("src", "IconLinkendin.png");
    expect(socialIcons[1]).toHaveAttribute("src", "IconGmail.png");
    expect(socialIcons[2]).toHaveAttribute("src", "IconInsta.png");
    expect(socialIcons[3]).toHaveAttribute("src", "IconTiktok.png");
  });
});