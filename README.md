# SME-SGP-Calendario-Microfrontend

Micro frontend do Calendário Escolar do Novo SGP. Uma única aplicação Vite atende várias rotas do WebClient, no mesmo modelo da Nova Sondagem e do Boletim.

Branch de trabalho: `calendario-microfrontend`.

## O que já foi feito

A primeira etapa migrou três telas do WebClient para este repositório, preservando layout, validação, permissões e os endpoints atuais da API do SGP.

| Tela                               | Rota no SGP                                         |
| ---------------------------------- | --------------------------------------------------- |
| Períodos Escolares                 | `/calendario-escolar/periodos-escolares`            |
| Período de Fechamento e Abertura   | `/calendario-escolar/periodo-fechamento-abertura`   |
| Período de Fechamento e Reabertura | `/calendario-escolar/periodo-fechamento-reabertura` |

A listagem de reabertura também abre o cadastro nestas rotas, porque Novo, Editar e Excluir dependem delas:

- `/calendario-escolar/periodo-fechamento-reabertura/novo/`
- `/calendario-escolar/periodo-fechamento-reabertura/novo/:tipoCalendarioId`
- `/calendario-escolar/periodo-fechamento-reabertura/editar/:id`

As demais telas de Calendário Escolar continuam no WebClient.

### Arquitetura

- Build com Vite 4 e Module Federation (`@originjs/vite-plugin-federation`).
- Nome do remote: `smeCalendario`.
- Arquivo publicado: `assets/remoteEntry.js`.
- Um único expose: `./Calendario` (`src/paginas/calendario/calendario.tsx`).
- A tela exibida é escolhida pela URL do navegador (`src/core/rotas.ts`). Não há três aplicações nem três serviços.
- Porta local: `5175`.
- React 19.2.8, Ant Design 5.4.0, Redux 4 e React Router 6, alinhados ao host.
- Dependências compartilhadas com o WebClient: `react`, `react-dom`, `react-dom/client`, `react/jsx-runtime`, `react-redux`, `redux`, `@reduxjs/toolkit`, `react-router-dom` e `antd`.

O host não instancia o remote pelo nome do webpack. O wrapper carrega `remoteEntry.js`, inicializa o share scope e monta `./Calendario` dentro do `Provider` do Redux do SGP.

### Integração no WebClient

No repositório `SME-NovoSGP-WebClient`, branch `calendario-microfrontend`:

- `src/@legacy/paginas/CalendarioEscolar/calendarioMicrofrontend.js` carrega o remote. A URL vem de `REACT_APP_URL_CALENDARIO` e, se não existir, usa `http://localhost:5175`.
- `src/routes/config/route-list.ts` aponta as rotas acima para esse wrapper. As telas legadas permanecem no código e saíram apenas do roteamento.
- `config-overrides.js` registra o remote `smeCalendario`.
- `.env.production` e `docker/startup.sh` substituem `REACT_APP_URL_CALENDARIO` no deploy.

O host envia `apiUrl={process.env.REACT_APP_URL_API}`. O micro frontend grava essa URL em `src/config.ts` e o Axios de `src/core/servico/apiSgp.ts` usa como `baseURL`.

### Autenticação e permissão

O token sai de `usuario.token` no Redux do host e vai no header `Authorization: Bearer`. Se `usuario.dataHoraExpiracao` já passou, o micro frontend dispara `@filtro/limparDadosFiltro`, `@usuario/deslogar`, `@sessao/limpar` e `@usuario/deslogarSessaoExpirou`. Em HTTP 401, o logout ocorre sem a action de sessão expirada.

As permissões vêm de `usuario.permissoes` nas mesmas chaves de rota do SGP (`podeConsultar`, `podeIncluir`, `podeAlterar`, `podeExcluir`).

### API usada nesta etapa

As URLs ficam nos serviços em `src/services`. Os componentes não montam a base da API.

| Serviço                       | Chamadas                                                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `calendarioService`           | `GET v1/calendarios/tipos/anos-letivos?descricao=`                                                              |
| `periodoEscolarService`       | `GET` e `POST v1/periodo-escolar`                                                                               |
| `periodoFechamentoService`    | `GET` e `POST /v1/periodos/fechamentos/aberturas` (`aplicacao=1`)                                               |
| `fechamentoReaberturaService` | `GET`, `POST`, `PUT` e `DELETE v1/fechamentos/reaberturas`                                                      |
| `abrangenciaService`          | `GET /v1/abrangencias/{consideraHistorico}/dres` e `GET /v1/abrangencias/{consideraHistorico}/dres/{dreId}/ues` |

A ordem da URL é: prop `apiUrl` do host, depois `window.__ENV__.VITE_SGP_API` (gerado no container), depois `VITE_SGP_API` do `.env`.

### Execução local

Na raiz deste repositório:

```powershell
npm install --legacy-peer-deps
copy .env.example .env
npm run dev
```

O `dev` sobe o Vite na porta 5175. Para o artefato que o WebClient carrega (`remoteEntry.js`), use o build e o preview:

```powershell
npm run build
npx vite preview --host 127.0.0.1 --port 5175 --strictPort
```

Ou, em um comando só:

```powershell
npm run mf:dev
```

No WebClient, com esta aplicação no ar:

```powershell
$env:REACT_APP_URL_CALENDARIO = "http://localhost:5175"
yarn run start
```

Sem a variável, o wrapper também usa `http://localhost:5175`. A API continua sendo `REACT_APP_URL_API` do host. É preciso estar autenticado no SGP para abrir as rotas.

### Deploy

O `Dockerfile` gera o `dist` com Node 22 e publica em nginx na porta 8080. Na subida, `startup.sh` preenche `env.js` com `VITE_SGP_API` e `VITE_CALENDARIO_VERSAO`. O nginx libera CORS em `remoteEntry.js` (`configuracoes/default.conf`).

No ambiente do WebClient, defina `REACT_APP_URL_CALENDARIO` com a URL pública deste serviço, sem barra no final. O `docker/startup.sh` do host substitui esse valor nos arquivos JavaScript publicados.

## O que ainda precisa ser feito

### 1. Validar dentro do SGP autenticado

O preview das três telas e a carga do `remoteEntry.js` a partir do host já foram conferidos. Falta percorrer o fluxo logado: menu, breadcrumb, permissões reais e as chamadas à API.

Como fazer:

1. Suba este serviço com `npm run mf:dev` ou com `build` + `preview` na porta 5175.
2. Suba o WebClient na branch `calendario-microfrontend`.
3. Entre com um usuário que tenha permissão nas três rotas.
4. Abra cada rota, inclua, altere e exclua um registro de reabertura, e confira no navegador se a URL, o método e o payload continuam iguais aos da tela antiga.

### 2. Publicar a URL do micro frontend por ambiente

Homologação e produção do WebClient ainda precisam receber `REACT_APP_URL_CALENDARIO` apontando para o serviço publicado deste repositório. Sem isso, o fallback local é `http://localhost:5175`.

### 3. Trocar a API numa etapa futura

Não altere os contratos agora. Quando a nova API existir, troque apenas os caminhos em `src/services` e, se a base mudar, a resolução em `src/config.ts` e `src/core/servico/apiSgp.ts`. Os componentes devem continuar chamando os serviços.

### 4. Migrar as outras telas de Calendário Escolar

Tipo de calendário, eventos, feriados e as demais telas do módulo ficaram de fora. Para cada uma:

1. Localize a tela e os serviços no WebClient.
2. Porte regras, validação e endpoints para este repositório.
3. Inclua o caminho em `src/core/rotas.ts` e em `src/App.tsx`.
4. No WebClient, troque o `component` da rota em `route-list.ts` por `CalendarioMicrofrontend`. Não crie outro remote.
