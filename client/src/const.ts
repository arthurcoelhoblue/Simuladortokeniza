export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "Tokeniza";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "/tokeniza-logo.svg";

// URL de login próprio do sistema
export const getLoginUrl = () => {
  return "/login";
};

// URL de cadastro
export const getRegisterUrl = () => {
  return "/cadastro";
};

// URL legada do OAuth Manus (mantida para compatibilidade)
export const getManusLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};