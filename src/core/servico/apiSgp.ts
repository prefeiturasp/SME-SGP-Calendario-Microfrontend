import axios from "axios";
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import dayjs from "dayjs";
import { getSgpApiUrl } from "../../config";
import { deslogarSessaoExpirada, deslogarSessaoInvalida } from "../sessao";

const TOKEN_EXPIRADO = "tokenExpirado";

type SessaoApi = {
  token?: string;
  logado?: boolean;
  dataHoraExpiracao?: string;
};

let sessao: SessaoApi = {};

export const definirSessaoApi = (nova: SessaoApi) => {
  sessao = nova;
};

const serializarValor = (valor: unknown) => {
  if (typeof valor === "string") return valor;
  if (typeof valor === "number") return valor.toString();
  if (typeof valor === "boolean") return valor.toString();
  if (typeof valor === "bigint") return valor.toString();
  if (typeof valor === "object") return JSON.stringify(valor);
  return "";
};

export const serializarParams = (params: Record<string, unknown>) => {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([chave, valor]) => {
    if (valor === null || valor === undefined || valor === "") return;
    if (Array.isArray(valor)) {
      valor.forEach((item) => {
        if (item !== null && item !== undefined && item !== "") {
          search.append(chave, serializarValor(item));
        }
      });
      return;
    }
    search.append(chave, serializarValor(valor));
  });
  return search.toString();
};

const apiSgp = axios.create();

apiSgp.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL = getSgpApiUrl();
  if (sessao.token) config.headers.Authorization = `Bearer ${sessao.token}`;
  config.headers.Accept = "application/json";

  if (sessao.dataHoraExpiracao) {
    const diff = dayjs().diff(dayjs(sessao.dataHoraExpiracao), "second");
    if (diff >= 0) {
      deslogarSessaoExpirada();
      const cancelado = new axios.Cancel(TOKEN_EXPIRADO);
      return Promise.reject(cancelado);
    }
  }

  return config;
});

apiSgp.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!axios.isCancel(error) && error?.response?.status === 401) {
      deslogarSessaoInvalida();
    }
    return Promise.reject(error);
  },
);

const comParams = (config?: AxiosRequestConfig) => ({
  ...config,
  paramsSerializer: {
    serialize: (params: Record<string, unknown>) => serializarParams(params),
  },
});

export const getSgp = <T>(url: string, config?: AxiosRequestConfig) =>
  apiSgp.get<T>(url, comParams(config));

export const postSgp = <T>(url: string, dados?: unknown) => apiSgp.post<T>(url, dados);

export const putSgp = <T>(url: string, dados?: unknown) => apiSgp.put<T>(url, dados);

export const deleteSgp = <T>(url: string, dados?: unknown) =>
  apiSgp.delete<T>(url, { data: dados });
