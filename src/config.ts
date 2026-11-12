let urlApiInformadaPeloHost = "";

const urlConfigurada = (
  informadaPeloHost: string,
  runtime: string | undefined,
  variavelVite: string | undefined,
) => {
  if (informadaPeloHost) return informadaPeloHost.replace(/\/$/, "");
  if (runtime) return runtime.replace(/\/$/, "");
  if (variavelVite) return variavelVite.replace(/\/$/, "");
  return "";
};

export const definirUrlApiSgp = (url?: string) => {
  if (url) urlApiInformadaPeloHost = url.replace(/\/$/, "");
};

export const getSgpApiUrl = (): string =>
  urlConfigurada(
    urlApiInformadaPeloHost,
    globalThis.__ENV__?.VITE_SGP_API,
    import.meta.env.VITE_SGP_API,
  );
