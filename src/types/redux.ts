export type UsuarioState = {
  token?: string;
  logado?: boolean;
  dataHoraExpiracao?: string;
  possuiPerfilSme?: boolean;
  possuiPerfilSmeOuDre?: boolean;
  acessoAdmin?: boolean;
  permissoes?: Record<
    string,
    {
      podeConsultar?: boolean;
      podeIncluir?: boolean;
      podeAlterar?: boolean;
      podeExcluir?: boolean;
    }
  >;
  turmaSelecionada?: { anoLetivo?: number };
  listaUrlAjudaDoSistema?: { rota?: string; url?: string }[];
};

export type NavegacaoState = {
  rotaAtiva?: string;
};

export type RootState = {
  usuario: UsuarioState;
  navegacao?: NavegacaoState;
  perfil?: { perfilSelecionado?: { nomePerfil?: string } };
};
