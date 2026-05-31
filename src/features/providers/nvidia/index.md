# providers/nvidia/

Provider **NVIDIA** para o code — integra a [NVIDIA NIM API](https://build.nvidia.com) para acesso a modelos de linguagem de alto desempenho hospedados pela NVIDIA na nuvem.

## Propósito

Este plugin conecta o code à infraestrutura de IA da NVIDIA, disponível em `https://integrate.api.nvidia.com`. Diferentemente dos providers locais (Ollama, LM Studio), o provider NVIDIA é exclusivamente em **nuvem** e requer uma **chave de API** (`NVIDIA_API_KEY`) obtida em [build.nvidia.com](https://build.nvidia.com).

O provider suporta:

- **Chat e completions** via API compatível com OpenAI (protocolo `openai-completions`)
- **Catálogo de modelos** pré-definido via manifesto `code.plugin.json` (inclui modelos como `nvidia/nemotron-3-super-120b-a12b`)
- **Modelos de raciocínio** com suporte a thinking/chain-of-thought
- **Modelos multimodais** com suporte a entrada de imagens

## Como ativar

```bash
# Opção 1 — variável de ambiente
NVIDIA_API_KEY="nvapi-xxxxxxxxxxxx" code

# Opção 2 — wizard interativo
code configure
# Selecione "NVIDIA API key" como método de autenticação

# Opção 3 — flag de linha de comando
code --nvidia-api-key nvapi-xxxxxxxxxxxx

# A chave pode ser obtida gratuitamente em: https://build.nvidia.com
```

A variável `CHRONOKAIRO_USE_NVIDIA=1` também pode ser usada para forçar a ativação.

## Arquivos

| Arquivo | Papel |
|---|---|
| [`index.ts`](./index.ts) | **Ponto de entrada do plugin.** Define e registra o provider via `defineSingleProviderPluginEntry`. Configura autenticação por API key (`NVIDIA_API_KEY`), catálogo de modelos e wizard de configuração. Constrói o catálogo aumentado de modelos a partir do manifesto JSON. |
| [`api.ts`](./api.ts) | **API pública do provider.** Re-exporta `buildNvidiaProvider`, `NVIDIA_DEFAULT_MODEL_ID`, `applyNvidiaConfig` e `applyNvidiaProviderConfig` para consumo externo. |
| [`onboard.ts`](./onboard.ts) | **Configuração e onboarding.** Define `NVIDIA_DEFAULT_MODEL_REF` e cria os appliers de preset de modelos via `createDefaultModelsPresetAppliers`. Funções `applyNvidiaConfig` e `applyNvidiaProviderConfig` aplicam a configuração de provider e modelo padrão ao `code.json`. |
| [`provider-catalog.ts`](./provider-catalog.ts) | **Catálogo de modelos NVIDIA.** Função `buildNvidiaProvider` que constrói a configuração do provider a partir do manifesto `code.plugin.json`. Define `NVIDIA_DEFAULT_MODEL_ID` (`nvidia/nemotron-3-super-120b-a12b`) e injeta `NVIDIA_API_KEY` como chave de autenticação. |
| [`package.json`](./package.json) | Manifesto do pacote Node.js do plugin. |
| [`tsconfig.json`](./tsconfig.json) | Configuração TypeScript do plugin. |
| [`index.test.ts`](./index.test.ts) | Testes do plugin principal (registro, catálogo, wizard). |
| [`onboard.test.ts`](./onboard.test.ts) | Testes das funções de onboarding e aplicação de configuração. |
| [`provider-catalog.test.ts`](./provider-catalog.test.ts) | Testes do catálogo de modelos NVIDIA. |
| [`plugin-registration.contract.test.ts`](./plugin-registration.contract.test.ts) | Teste de contrato de registro do plugin. |

> **Nota:** O NVIDIA provider não possui subpasta `src/` — toda a implementação está na raiz da pasta `nvidia/`, pois é mais simples que os providers locais (não requer descoberta dinâmica, preload ou autenticação sintética).

## Contexto de uso

- **Endpoint de API:** `https://integrate.api.nvidia.com/v1` (definido no manifesto `code.plugin.json`)
- **Autenticação:** Requer `NVIDIA_API_KEY` válida. A chave pode ser configurada via env var, flag CLI ou wizard interativo.
- **Modelos:** O catálogo de modelos disponíveis é definido estaticamente no manifesto `code.plugin.json` (campo `modelCatalog.providers.nvidia`). Inclui modelos da família Nemotron, Llama e outros modelos open-weight hospedados pela NVIDIA.
- **Sem descoberta dinâmica:** Ao contrário do Ollama e LM Studio, o NVIDIA provider não consulta a API para listar modelos em runtime — usa o catálogo pré-compilado no manifesto.
- **preserveLiteralProviderPrefix:** O ID do provider nos modelos é preservado como `nvidia/` (ex: `nvidia/nemotron-3-super-120b-a12b`), não normalizado.
