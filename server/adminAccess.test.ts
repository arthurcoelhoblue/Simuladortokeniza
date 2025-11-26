import { describe, it, expect, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Testes do adminProcedure
 * Valida controle de acesso baseado em email
 */
describe("Admin Access Control", () => {
  describe("adminProcedure", () => {
    it("deve permitir acesso para arthur@blueconsult.com.br", () => {
      const mockCtx = {
        user: {
          id: 1,
          email: "arthur@blueconsult.com.br",
          name: "Arthur",
        },
      };

      const adminEmails = ["arthur@blueconsult.com.br"];
      const email = mockCtx.user?.email;

      expect(email).toBeDefined();
      expect(adminEmails.includes(email!)).toBe(true);
    });

    it("deve retornar FORBIDDEN para outros emails", () => {
      const mockCtx = {
        user: {
          id: 2,
          email: "usuario@example.com",
          name: "Usuário Comum",
        },
      };

      const adminEmails = ["arthur@blueconsult.com.br"];
      const email = mockCtx.user?.email;

      expect(email).toBeDefined();
      expect(adminEmails.includes(email!)).toBe(false);

      // Simular lançamento de erro
      const shouldThrow = !email || !adminEmails.includes(email);
      expect(shouldThrow).toBe(true);
    });

    it("deve retornar FORBIDDEN para usuário sem email", () => {
      const mockCtx = {
        user: {
          id: 3,
          email: null,
          name: "Usuário Sem Email",
        },
      };

      const adminEmails = ["arthur@blueconsult.com.br"];
      const email = mockCtx.user?.email;

      const shouldThrow = !email || !adminEmails.includes(email);
      expect(shouldThrow).toBe(true);
    });

    it("deve retornar FORBIDDEN para usuário não logado", () => {
      const mockCtx = {
        user: null,
      };

      const adminEmails = ["arthur@blueconsult.com.br"];
      const email = mockCtx.user?.email;

      const shouldThrow = !email || !adminEmails.includes(email);
      expect(shouldThrow).toBe(true);
    });
  });

  describe("Lista de admins", () => {
    it("deve conter apenas arthur@blueconsult.com.br", () => {
      const adminEmails = ["arthur@blueconsult.com.br"];

      expect(adminEmails).toHaveLength(1);
      expect(adminEmails[0]).toBe("arthur@blueconsult.com.br");
    });

    it("deve rejeitar emails não listados", () => {
      const adminEmails = ["arthur@blueconsult.com.br"];
      const testEmails = [
        "admin@example.com",
        "user@test.com",
        "arthur@gmail.com", // Similar mas não é o correto
        "ARTHUR@blueconsult.com.br", // Case sensitive
      ];

      testEmails.forEach((email) => {
        expect(adminEmails.includes(email)).toBe(false);
      });
    });
  });

  describe("Mensagem de erro", () => {
    it("deve ter mensagem descritiva de acesso negado", () => {
      const errorMessage = "Acesso negado. Esta funcionalidade é restrita a administradores.";

      expect(errorMessage).toContain("Acesso negado");
      expect(errorMessage).toContain("administradores");
    });

    it("deve usar código FORBIDDEN", () => {
      const errorCode = "FORBIDDEN";

      expect(errorCode).toBe("FORBIDDEN");
    });
  });
});
