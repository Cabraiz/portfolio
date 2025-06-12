import { http, HttpResponse, PathParams } from "msw";
import { nanoid } from "@reduxjs/toolkit";

// Token simulado
const token = nanoid();

export const handlers = [
  // Handler para GET "/protected"
  http.get<PathParams, never, { message: string }>(
    "/protected",
    async ({ request }) => {
      // Acessa o cabeçalho de autorização
      const authorization = request.headers.get("authorization");

      if (authorization !== `Bearer ${token}`) {
        return HttpResponse.json(
          { message: "You shall not pass. Please login first." },
          { status: 401 },
        );
      }

      return HttpResponse.json(
        { message: "Alright, you are authorized" },
        { status: 200 },
      );
    },
  ),

  // Handler para POST "/loginhublocal"
  http.post<
    PathParams,
    never,
    { user: { first_name: string; last_name: string }; token: string }
  >("/loginhublocal", async () => {
    return HttpResponse.json(
      {
        user: {
          first_name: "Test",
          last_name: "User",
        },
        token,
      },
      { status: 200 },
    );
  }),
];
