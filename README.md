# Sistema Corporativo Interno

Sistema completo de gestão empresarial com funcionalidades integradas para Orçamentos, Autorizações, Notas Fiscais, Gestão Administrativa e Marketing.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Executar Localmente no Replit](#executar-localmente-no-replit)
- [Enviar para GitHub](#enviar-para-github)
- [Deploy na UOL Host](#deploy-na-uol-host)
- [Atualizações Futuras via GitHub](#atualizações-futuras-via-github)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [User Stories](#user-stories)

---

## 🎯 Sobre o Projeto

O Sistema Corporativo Interno é uma plataforma web completa desenvolvida para otimizar processos empresariais internos. O sistema oferece uma interface profissional e responsiva, com autenticação segura e gestão integrada de múltiplos módulos operacionais.

### Principais Características

- **Autenticação Segura**: Integração com Replit Auth (suporta Google, GitHub, email/senha)
- **Arquitetura Moderna**: Fullstack JavaScript com TypeScript
- **Banco de Dados Robusto**: PostgreSQL com Drizzle ORM
- **Interface Responsiva**: Design profissional com Tailwind CSS e shadcn/ui
- **API REST**: Endpoints bem estruturados e documentados
- **Deploy Flexível**: Compatível com Replit e UOL Host

---

## 🚀 Funcionalidades

### 1. **Orçamentos** (Publicações em Jornais Oficiais)

Sistema especializado para criar orçamentos de publicações em jornais como Diário Oficial da União.

**Características:**
- Formulário com até 5 linhas de publicação
- Cada linha contém:
  - Nome do Jornal (ex: Diário Oficial da União)
  - Valor cm x col./linha
  - Checkbox para incluir no cálculo total
- Campos adicionais:
  - Cliente (obrigatório)
  - E-mail (obrigatório)
  - Formato (multiplicador)
  - Diagramação
  - Data
  - Observações
  - Checkbox "Aprovado" geral

**Cálculo Automático:**
```
Para cada linha marcada:
  valor_linha = formato × valor_cm_col

Valor Total = Σ(valores_linhas_marcadas) + diagramação
```

**Validações:**
- Cliente obrigatório
- E-mail obrigatório e válido
- Pelo menos uma linha marcada

### 2. **Autorizações**

Workflow de aprovação para solicitações internas (compras, viagens, contratações, treinamentos).

**Funcionalidades:**
- Criar solicitação de autorização com formulário "Dados do Cliente"
- **Integração Google Sheets**: Autopreenchimento de dados por CNPJ
  - Busca automática com debounce de 500ms
  - Cache em memória (TTL 1 hora)
  - Fallback para preenchimento manual se cliente não encontrado
  - Validação de formato CNPJ (14 dígitos)
- Aprovar/rejeitar solicitações
- Adicionar comentários
- Histórico de decisões
- Dashboard com status (pendentes, aprovadas, rejeitadas)

### 3. **Notas Fiscais**

Sistema de emissão e gerenciamento de notas fiscais eletrônicas.

**Funcionalidades:**
- Emissão de NF com cálculo automático de impostos
- Simulação de tributos (ISS, COFINS, PIS)
- Gestão de status (rascunho, emitida, cancelada)
- Visualização e download

### 4. **Gestão Administrativa**

Controle centralizado de documentos e processos administrativos.

**Funcionalidades:**
- Upload e categorização de documentos
- Gestão de processos internos
- Controle de prazos e responsáveis
- Organização por categorias (Contratos, Políticas, Atas)

### 5. **Marketing**

Gerenciamento de campanhas e leads.

**Funcionalidades:**
- Criação de campanhas de marketing
- Registro e pontuação de leads
- Acompanhamento de conversões
- Métricas e dashboards analíticos

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Framework JavaScript
- **TypeScript** - Type safety
- **Wouter** - Roteamento leve
- **TanStack Query** - Gerenciamento de estado servidor
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Lucide React** - Ícones

### Backend
- **Node.js 20** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Type safety
- **Drizzle ORM** - Object-Relational Mapping
- **Passport.js** - Autenticação
- **OpenID Connect** - Protocolo de autenticação

### Banco de Dados
- **PostgreSQL** - Banco de dados relacional
- **Neon Serverless** - Cliente PostgreSQL

### Autenticação
- **Replit Auth** - OpenID Connect Provider
- **Session Storage** - PostgreSQL-based sessions

---

## 💻 Executar Localmente no Replit

### Pré-requisitos

Este projeto já está configurado no Replit. Basta seguir os passos:

### 1. Iniciar o Projeto

```bash
# O Replit instala dependências automaticamente
# Se necessário, execute:
npm install
```

### 2. Configurar Variáveis de Ambiente

As seguintes variáveis já estão configuradas automaticamente pelo Replit:

```env
DATABASE_URL=<url-do-postgresql>
SESSION_SECRET=<secret-gerado-automaticamente>
REPL_ID=<id-do-repl>
ISSUER_URL=https://replit.com/oidc
```

**Nota:** Estas variáveis são gerenciadas pelo Replit e não devem ser alteradas manualmente.

### 3. Executar Migrações do Banco de Dados

```bash
# Push do schema para o banco de dados
npm run db:push
```

### 4. Iniciar o Servidor

```bash
# Modo desenvolvimento (já configurado como workflow padrão)
npm run dev
```

O sistema estará disponível em `https://<seu-repl>.replit.dev`

### 5. Fazer Login

1. Acesse a URL do seu Repl
2. Clique em "Fazer Login"
3. Autentique-se via Replit Auth (Google, GitHub ou email/senha)

---

## 📦 Enviar para GitHub

### Comandos Essenciais do Git

#### 1. Inicializar Repositório Git (se necessário)

```bash
git init
```

#### 2. Configurar Usuário Git

```bash
git config user.name "Seu Nome"
git config user.email "seu-email@exemplo.com"
```

#### 3. Adicionar Arquivos ao Staging

```bash
# Adicionar todos os arquivos
git add .

# Adicionar arquivos específicos
git add arquivo.ts outro-arquivo.tsx
```

#### 4. Fazer Commit das Mudanças

```bash
git commit -m "feat: descrição clara da mudança"
```

**Convenções de Commit:**
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação
- `refactor:` - Refatoração de código
- `test:` - Testes
- `chore:` - Tarefas de manutenção

#### 5. Criar Repositório no GitHub

1. Acesse https://github.com
2. Clique em "New repository"
3. Nome do repositório: `sistema-corporativo`
4. **Não** inicialize com README, .gitignore ou licença
5. Clique em "Create repository"

#### 6. Conectar Repositório Local ao GitHub

```bash
# Adicionar remote
git remote add origin https://github.com/seu-usuario/sistema-corporativo.git

# Verificar remote
git remote -v
```

#### 7. Enviar Código para GitHub

```bash
# Primeira vez (criar branch main e enviar)
git branch -M main
git push -u origin main

# Envios posteriores
git push
```

### Exemplo Completo de Workflow Git

```bash
# 1. Fazer mudanças no código
# 2. Verificar status
git status

# 3. Adicionar mudanças
git add .

# 4. Commit
git commit -m "feat: adicionar validação de e-mail no módulo orçamentos"

# 5. Enviar para GitHub
git push
```

---

## 🌐 Deploy na UOL Host

A UOL Host suporta aplicações Node.js. Siga este guia para fazer deploy:

### Pré-requisitos

- Conta na UOL Host
- Acesso SSH ou painel de controle
- Node.js 18+ habilitado no servidor

### Opção 1: Deploy via Git (Recomendado)

#### 1. No Servidor UOL Host

```bash
# Conectar via SSH
ssh seu-usuario@seu-dominio.com.br

# Navegar para diretório da aplicação
cd ~/public_html  # ou diretório configurado

# Clonar repositório do GitHub
git clone https://github.com/seu-usuario/sistema-corporativo.git
cd sistema-corporativo
```

#### 2. Instalar Dependências

```bash
# Instalar dependências
npm install --production
```

#### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` no servidor:

```bash
nano .env
```

Adicione as variáveis:

```env
NODE_ENV=production
DATABASE_URL=postgresql://usuario:senha@host:5432/database
SESSION_SECRET=<gere-um-secret-forte-aqui>
REPL_ID=<seu-app-id>
ISSUER_URL=https://replit.com/oidc
PORT=5000
```

**Importante:** 
- Use um SECRET forte para SESSION_SECRET (pode gerar com: `openssl rand -base64 32`)
- Configure um banco PostgreSQL na UOL Host ou use serviço externo (Neon, Supabase)

#### 4. Executar Migrações

```bash
npm run db:push
```

#### 5. Build da Aplicação

```bash
npm run build  # Se houver script de build
```

#### 6. Iniciar Aplicação

```bash
# Opção 1: Usar PM2 (recomendado para produção)
npm install -g pm2
pm2 start npm --name "sistema-corporativo" -- start

# Opção 2: Iniciar diretamente
npm start
```

#### 7. Configurar Como Serviço (PM2)

```bash
# Salvar lista de processos
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
```

### Opção 2: Deploy Manual (Upload FTP)

1. Compacte o projeto localmente (excluindo `node_modules`)
2. Faça upload via FTP para o servidor
3. No servidor, execute:

```bash
cd ~/public_html/sistema-corporativo
npm install --production
# Continue com passos 3-6 da Opção 1
```

### Configuração de Domínio

No painel da UOL Host:

1. Aponte seu domínio/subdomínio para o IP do servidor
2. Configure proxy reverso (se disponível) para redirecionar para porta Node.js
3. Ou use ferramentas como `nginx` para gerenciar o proxy

Exemplo de configuração nginx:

```nginx
server {
    listen 80;
    server_name seudominio.com.br;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Monitoramento

```bash
# Ver logs PM2
pm2 logs sistema-corporativo

# Monitorar status
pm2 status

# Reiniciar aplicação
pm2 restart sistema-corporativo
```

---

## 🔄 Atualizações Futuras via GitHub

### Workflow de Atualização

#### 1. Desenvolver Localmente/Replit

```bash
# Fazer mudanças no código
# Testar localmente

# Commit
git add .
git commit -m "feat: nova funcionalidade XYZ"

# Enviar para GitHub
git push
```

#### 2. Atualizar no Servidor UOL Host

```bash
# SSH no servidor
ssh seu-usuario@seu-dominio.com.br

# Navegar para diretório
cd ~/public_html/sistema-corporativo

# Baixar atualizações
git pull origin main

# Instalar novas dependências (se houver)
npm install --production

# Executar migrações (se houver mudanças no schema)
npm run db:push

# Reiniciar aplicação
pm2 restart sistema-corporativo
```

### Script de Deploy Automatizado

Crie um arquivo `deploy.sh`:

```bash
#!/bin/bash

# Script de deploy automático
echo "🚀 Iniciando deploy..."

# Pull das mudanças
echo "📥 Baixando atualizações do GitHub..."
git pull origin main

# Instalar dependências
echo "📦 Instalando dependências..."
npm install --production

# Executar migrações
echo "🗄️ Executando migrações do banco..."
npm run db:push

# Reiniciar aplicação
echo "🔄 Reiniciando aplicação..."
pm2 restart sistema-corporativo

echo "✅ Deploy concluído com sucesso!"
```

Tornar executável:

```bash
chmod +x deploy.sh
```

Usar:

```bash
./deploy.sh
```

### Versionamento Semântico

Recomenda-se seguir [Semantic Versioning](https://semver.org/):

```bash
# Para mudanças menores (bugfixes)
git tag v1.0.1
git push --tags

# Para novas features
git tag v1.1.0
git push --tags

# Para breaking changes
git tag v2.0.0
git push --tags
```

---

## 🔐 Variáveis de Ambiente

### Ambiente de Desenvolvimento (Replit)

```env
# Banco de Dados (gerado automaticamente)
DATABASE_URL=<postgresql-connection-string>
PGHOST=<host>
PGPORT=<port>
PGUSER=<user>
PGPASSWORD=<password>
PGDATABASE=<database>

# Autenticação (gerado automaticamente)
SESSION_SECRET=<secret-forte>
REPL_ID=<id-do-repl>
ISSUER_URL=https://replit.com/oidc

# Ambiente
NODE_ENV=development
```

### Ambiente de Produção (UOL Host)

```env
# Banco de Dados (configurar manualmente)
DATABASE_URL=postgresql://usuario:senha@host:porta/database

# Autenticação (configurar manualmente)
SESSION_SECRET=<gerar-com: openssl rand -base64 32>
REPL_ID=<mesmo-id-usado-no-replit>
ISSUER_URL=https://replit.com/oidc

# Google Sheets Integration (configurar manualmente)
GOOGLE_SHEETS_CREDENTIALS=<credenciais-service-account-base64>
GOOGLE_SHEETS_SHEET_ID=<id-da-planilha>

# Ambiente
NODE_ENV=production
PORT=5000
```

### Gerar SESSION_SECRET Seguro

```bash
# Usando OpenSSL
openssl rand -base64 32

# Usando Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Gerenciamento de Secrets

**⚠️ IMPORTANTE:**
- **NUNCA** commit arquivos `.env` no Git
- Use `.gitignore` para excluir arquivos sensíveis
- No servidor de produção, armazene secrets com segurança
- Rotacione secrets periodicamente

---

## 📊 Configuração da Integração Google Sheets

O módulo de Autorizações inclui integração com Google Sheets para autopreenchimento de dados de clientes por CNPJ.

### Pré-requisitos

- Conta Google (Gmail)
- Planilha Google Sheets com dados dos clientes
- Acesso ao Google Cloud Console

### Estrutura da Planilha

Sua planilha deve ter a seguinte estrutura na **Sheet1** (primeira aba):

| cnpj | razao_social | endereco | cidade | cep | uf | email |
|------|--------------|----------|--------|-----|----|----- |
| 91.338.558/0001-37 | MUNICIPIO DE GLORINHA | AV DR. POMPILIO GOMES SOBRINHO | Glorinha | 90000-000 | RS | prefeitura@glorinha.rs.gov.br |
| 88.847.660/0001-53 | PUBLIDIAS SERVIÇO DE PUBLICIDADE LTDA | RUA MARIO ANTUNES DA CUNHA | Porto Alegre | 90340-000 | RS | publidias@publidias.com.br |

**Observações:**
- A primeira linha deve conter os cabeçalhos exatamente como acima
- Os dados começam na linha 2
- O CNPJ pode estar formatado (com pontos e traços) ou sem formatação
- Todos os campos são opcionais, mas CNPJ é usado como chave de busca

### Passo 1: Criar Service Account no Google Cloud

1. Acesse https://console.cloud.google.com
2. Crie um novo projeto ou selecione um existente
3. Navegue até **APIs & Services** → **Enable APIs and Services**
4. Busque e ative a **Google Sheets API**
5. Vá para **APIs & Services** → **Credentials**
6. Clique em **Create Credentials** → **Service Account**
7. Preencha:
   - **Service account name**: `sheets-autorizacoes` (ou nome de sua escolha)
   - **Service account ID**: (será gerado automaticamente)
   - **Role**: Project → Editor (ou permissões mínimas conforme necessário)
8. Clique em **Done**

### Passo 2: Gerar Chave JSON

1. Na lista de Service Accounts, clique na conta recém-criada
2. Vá para a aba **Keys**
3. Clique em **Add Key** → **Create New Key**
4. Selecione **JSON** como formato
5. Clique em **Create**
6. Um arquivo JSON será baixado automaticamente
   - **Guarde este arquivo com segurança!**
   - Exemplo de nome: `sistema-corporativo-abc123.json`

### Passo 3: Compartilhar a Planilha

1. Abra a planilha Google Sheets que contém os dados dos clientes
2. Clique em **Compartilhar** (botão verde no canto superior direito)
3. No arquivo JSON baixado, localize o campo `client_email`
   - Exemplo: `sheets-autorizacoes@projeto-123456.iam.gserviceaccount.com`
4. Cole este email no campo de compartilhamento
5. Defina permissão como **Viewer** (leitura) ou **Editor** (leitura/escrita)
6. Clique em **Share** / **Compartilhar**

### Passo 4: Obter ID da Planilha

1. Na URL da sua planilha Google Sheets, copie o ID:
   ```
   https://docs.google.com/spreadsheets/d/1ksScLRs1L1KL9IzgxLKkxJFX9DQyO4tMhXzs46WLDZ4/edit
                                          ↑_________________________________↑
                                          Este é o GOOGLE_SHEETS_SHEET_ID
   ```
2. Neste exemplo: `1ksScLRs1L1KL9IzgxLKkxJFX9DQyO4tMhXzs46WLDZ4`

### Passo 5: Configurar Variáveis de Ambiente

#### No Replit (Desenvolvimento)

1. No painel lateral do Replit, vá para **Secrets** (ícone de cadeado)
2. Adicione duas variáveis:

**GOOGLE_SHEETS_CREDENTIALS:**
```bash
# Converta o arquivo JSON para base64:
cat sistema-corporativo-abc123.json | base64 -w 0

# Cole o resultado (uma linha longa) no valor do secret
```

**GOOGLE_SHEETS_SHEET_ID:**
```
1ksScLRs1L1KL9IzgxLKkxJFX9DQyO4tMhXzs46WLDZ4
```

#### Na UOL Host (Produção)

Edite o arquivo `.env` no servidor:

```bash
# No SSH do servidor
nano ~/public_html/sistema-corporativo/.env
```

Adicione:

```env
# Google Sheets Integration
GOOGLE_SHEETS_CREDENTIALS=eyJjbGllbnRfZW1haWwiOiJzaGVldHMtYXV0...
GOOGLE_SHEETS_SHEET_ID=1ksScLRs1L1KL9IzgxLKkxJFX9DQyO4tMhXzs46WLDZ4
```

### Passo 6: Testar a Integração

1. Reinicie a aplicação:
   ```bash
   # No Replit: clique em "Stop" e depois "Run"
   
   # Na UOL Host via PM2:
   pm2 restart sistema-corporativo
   ```

2. Verifique os logs do servidor:
   ```
   ✅ Google Sheets Service inicializado com sucesso
   ```

3. Teste no navegador:
   - Acesse o módulo **Autorizações**
   - Clique em **Nova Solicitação**
   - No formulário "Dados do Cliente", digite um CNPJ válido da planilha
   - Aguarde 500ms (debounce)
   - Os campos devem ser preenchidos automaticamente

### Como Funciona

1. **Debounce**: Quando o usuário digita o CNPJ, o sistema aguarda 500ms antes de fazer a busca
2. **Validação**: Verifica se o CNPJ tem 14 dígitos (remove caracteres especiais)
3. **Cache**: Primeira busca consulta Google Sheets; resultados ficam em cache por 1 hora
4. **Autopreenchimento**: Se cliente encontrado, preenche automaticamente:
   - Razão Social
   - Endereço Completo
   - Cidade
   - UF (Estado)
   - CEP
   - E-mail
5. **Fallback Manual**: Se cliente não encontrado, exibe mensagem e permite preenchimento manual
6. **Edição Livre**: Todos os campos permanecem editáveis após autopreenchimento

### Mensagens do Sistema

- ✅ **"Cliente encontrado!"** - Dados preenchidos automaticamente
- ⚠️ **"Cliente não cadastrado. Preencha os dados manualmente."** - CNPJ não existe na planilha
- 🔍 **Spinner de loading** - Buscando dados no Google Sheets
- ❌ **Erro de integração** - Problema de configuração ou conexão

### Solução de Problemas

#### "Google Sheets Service não está configurado"

Verifique se as variáveis de ambiente estão corretas:
```bash
# Checar se existe
echo $GOOGLE_SHEETS_CREDENTIALS
echo $GOOGLE_SHEETS_SHEET_ID

# Ambas devem retornar valores
```

#### "Erro ao consultar Google Sheets"

1. Verifique se a planilha foi compartilhada com o email da Service Account
2. Confirme se a Google Sheets API está ativada no Google Cloud Console
3. Verifique os logs do servidor para mais detalhes

#### Cache não está funcionando

Os logs do servidor mostram se é cache HIT ou MISS:
```
🎯 Cache HIT para CNPJ: 91.338.558/0001-37
🔍 Cache MISS - Buscando CNPJ 88.847.660/0001-53 no Google Sheets...
```

#### Limpar cache manualmente

O cache é em memória e se renova automaticamente após 1 hora. Para forçar renovação, reinicie a aplicação:

```bash
# Replit: Stop e Run novamente
# UOL Host:
pm2 restart sistema-corporativo
```

### Segurança

✅ **Práticas Recomendadas:**
- Service Account com permissões mínimas necessárias
- Planilha compartilhada apenas com a Service Account
- Credenciais armazenadas em variáveis de ambiente (nunca no código)
- Credentials em base64 para evitar problemas com quebras de linha

❌ **NÃO FAÇA:**
- Não commite o arquivo JSON no Git
- Não exponha as credenciais no frontend
- Não compartilhe a planilha publicamente
- Não use API Key (use Service Account)

### Manutenção

**Atualizar dados na planilha:**
- Edite diretamente no Google Sheets
- Mudanças estarão disponíveis após expiração do cache (1 hora)
- Ou reinicie a aplicação para forçar atualização imediata

**Adicionar novos clientes:**
- Basta adicionar nova linha na planilha com o CNPJ e demais dados
- Mantenha a estrutura das colunas

**Remover/Desativar integração:**
- Remova as variáveis `GOOGLE_SHEETS_CREDENTIALS` e `GOOGLE_SHEETS_SHEET_ID`
- Reinicie a aplicação
- O formulário continuará funcionando, mas sem autopreenchimento

---

## 📁 Estrutura do Projeto

```
sistema-corporativo/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   │   ├── ui/           # Componentes shadcn/ui
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── stat-card.tsx
│   │   │   ├── status-badge.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── hooks/            # React hooks customizados
│   │   │   └── useAuth.ts
│   │   ├── lib/              # Utilitários
│   │   │   ├── authUtils.ts
│   │   │   └── queryClient.ts
│   │   ├── pages/            # Páginas da aplicação
│   │   │   ├── dashboard.tsx
│   │   │   ├── orcamentos.tsx (⭐ Módulo principal)
│   │   │   ├── autorizacoes.tsx
│   │   │   ├── notas-fiscais.tsx
│   │   │   ├── gestao-administrativa.tsx
│   │   │   ├── marketing.tsx
│   │   │   ├── landing.tsx
│   │   │   └── not-found.tsx
│   │   ├── App.tsx           # Componente raiz
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Estilos globais
│   └── index.html            # HTML template
│
├── server/                    # Backend Express
│   ├── db.ts                 # Configuração PostgreSQL
│   ├── replitAuth.ts         # Autenticação Replit
│   ├── routes.ts             # Rotas da API REST
│   ├── storage.ts            # Camada de persistência
│   ├── index.ts              # Entry point do servidor
│   └── vite.ts               # Integração Vite
│
├── shared/                    # Código compartilhado
│   └── schema.ts             # Schema Drizzle + tipos TypeScript
│
├── .gitignore                # Arquivos ignorados pelo Git
├── drizzle.config.ts         # Configuração Drizzle ORM
├── package.json              # Dependências e scripts
├── tailwind.config.ts        # Configuração Tailwind
├── tsconfig.json             # Configuração TypeScript
├── vite.config.ts            # Configuração Vite
├── design_guidelines.md      # Guidelines de design
└── README.md                 # Este arquivo
```

---

## 🎭 User Stories

### Template Geral

```
Como [gestor/funcionário],
Quero acessar [área do sistema],
Para [realizar ações em orçamentos, autorizações, notas fiscais, gestão administrativa, marketing],
Visando melhorar o fluxo operacional da empresa.
```

### Exemplos Específicos

#### Orçamentos
```
Como gestor comercial,
Quero criar orçamentos de publicações em jornais oficiais,
Para fornecer propostas precisas aos clientes,
Visando agilizar o processo de vendas e evitar erros de cálculo.
```

#### Autorizações
```
Como gerente de departamento,
Quero aprovar ou rejeitar solicitações de compras,
Para manter controle sobre despesas do meu setor,
Visando garantir compliance com o orçamento aprovado.
```

#### Notas Fiscais
```
Como contador,
Quero emitir notas fiscais eletrônicas rapidamente,
Para formalizar serviços prestados aos clientes,
Visando manter conformidade fiscal e agilizar o faturamento.
```

#### Gestão Administrativa
```
Como coordenador administrativo,
Quero organizar e acessar documentos corporativos,
Para facilitar auditorias e consultas internas,
Visando reduzir tempo de busca e melhorar governança.
```

#### Marketing
```
Como analista de marketing,
Quero acompanhar métricas de campanhas e conversão de leads,
Para otimizar estratégias de aquisição de clientes,
Visando aumentar ROI das iniciativas de marketing.
```

---

## 📝 Scripts NPM Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor em modo desenvolvimento

# Banco de Dados
npm run db:push      # Push schema para PostgreSQL
npm run db:studio    # Abre Drizzle Studio (GUI para BD)

# Build (se configurado)
npm run build        # Build para produção

# Produção
npm start            # Inicia servidor em modo produção
```

---

## 🔧 Solução de Problemas

### Erro: "Cannot find module"

```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro de Conexão com Banco de Dados

```bash
# Verificar variável DATABASE_URL
echo $DATABASE_URL

# Testar conexão
npm run db:push
```

### Erro de Autenticação

1. Verificar se `SESSION_SECRET` está configurado
2. Limpar cookies do navegador
3. Tentar fazer login novamente

### Port Already in Use

```bash
# Encontrar processo na porta 5000
lsof -i :5000

# Matar processo
kill -9 <PID>
```

---

## 📄 Licença

Este projeto é de propriedade privada da empresa. Todos os direitos reservados.

---

## 👥 Suporte

Para dúvidas ou problemas:
1. Consulte este README
2. Verifique a seção de Solução de Problemas
3. Entre em contato com a equipe de TI interna

---

## 🎯 Próximos Passos

- [ ] Implementar testes automatizados
- [ ] Adicionar relatórios em PDF
- [ ] Integrar com API de emissão real de NF-e
- [ ] Implementar notificações por email
- [ ] Criar dashboard analítico avançado
- [ ] Adicionar sistema de permissões granular

---

**Desenvolvido com ❤️ usando Fullstack JavaScript**
