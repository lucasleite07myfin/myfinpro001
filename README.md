# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/9121669d-6a96-4fbf-a7dc-cf01d578dad7

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9121669d-6a96-4fbf-a7dc-cf01d578dad7) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## ⚙️ Configuração de Variáveis de Ambiente

### 🔐 Segurança Primeiro

**⚠️ NUNCA comitar o arquivo `.env` ou chaves reais no repositório!**

Este projeto usa **Lovable Cloud** (baseado em Supabase) que gerencia automaticamente as variáveis de ambiente principais.

### 📝 Configuração para Desenvolvimento Local

1. **Clone o repositório** (se ainda não fez)
   ```sh
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Copie o template de variáveis de ambiente**
   ```sh
   cp .env.example .env
   ```

3. **As variáveis do Supabase são preenchidas automaticamente pelo Lovable**
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`

4. **Configure secrets sensíveis no painel do Lovable Cloud**
   - Acesse: [Lovable Project](https://lovable.dev/projects/9121669d-6a96-4fbf-a7dc-cf01d578dad7)
   - Vá em: **Settings > Backend > Secrets**
   - Adicione as chaves necessárias:
     - `STRIPE_SECRET_KEY`
     - `STRIPE_WEBHOOK_SECRET`

### 🚨 Variáveis que NUNCA devem estar no código

- ❌ Chaves privadas do Stripe
- ❌ Tokens de API de terceiros
- ❌ Senhas de banco de dados
- ❌ JWT secrets
- ❌ Service role keys do Supabase

### ✅ Variáveis seguras para o frontend (públicas)

- ✅ `VITE_SUPABASE_URL` (URL pública do Supabase)
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY` (Anon key pública)
- ✅ `VITE_SUPABASE_PROJECT_ID` (ID público do projeto)

**Nota:** Mesmo sendo públicas, essas variáveis ficam protegidas por RLS (Row Level Security) no Supabase.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9121669d-6a96-4fbf-a7dc-cf01d578dad7) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
