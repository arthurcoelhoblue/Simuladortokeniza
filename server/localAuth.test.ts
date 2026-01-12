import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashPassword, verifyPassword, generateToken, generateLocalOpenId, isEmailInUse } from "./auth";

describe("Local Authentication", () => {
  describe("Password Hashing", () => {
    it("should hash password correctly", async () => {
      const password = "Senha123!";
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it("should verify correct password", async () => {
      const password = "Senha123!";
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "Senha123!";
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword("SenhaErrada!", hash);
      expect(isValid).toBe(false);
    });
  });

  describe("Token Generation", () => {
    it("should generate unique tokens", () => {
      const token1 = generateToken();
      const token2 = generateToken();
      
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64); // 32 bytes em hex = 64 chars
    });
  });

  describe("Local OpenId Generation", () => {
    it("should generate unique local openIds", () => {
      const openId1 = generateLocalOpenId();
      const openId2 = generateLocalOpenId();
      
      expect(openId1).toBeDefined();
      expect(openId2).toBeDefined();
      expect(openId1).not.toBe(openId2);
      expect(openId1.startsWith("local_")).toBe(true);
      expect(openId2.startsWith("local_")).toBe(true);
    });
  });
});
