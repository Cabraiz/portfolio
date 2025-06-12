import type { Meta, StoryObj } from "@storybook/react";

import { Header } from "./Header";

const meta = {
  title: "Example/Header",
  component: Header,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LoggedIn: Story = {
  args: {
    user: {
      name: "Jane Doe",
    },
    onLogin: () => console.log("Login clicked"),
    onLogout: () => console.log("Logout clicked"),
    onCreateAccount: () => console.log("Create Account clicked"),
  },
};

export const LoggedOut: Story = {
  args: {
    user: undefined,
    onLogin: () => console.log("Login clicked"),
    onLogout: () => console.log("Logout clicked"),
    onCreateAccount: () => console.log("Create Account clicked"),
  },
};
