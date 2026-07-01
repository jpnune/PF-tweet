# Chirp (PF-tweet) 🐦

Chirp é uma rede social inspirada no Twitter desenvolvida como uma aplicação web completa (Full-stack). A plataforma permite a criação de postagens (Chirps), curtidas, retweets, comentários em tempo real, além de um sistema de conexões (seguidores/seguindo), feed personalizado e edição de perfil customizável.

## 🚀 Links do Projeto

* **Deploy em Produção (Frontend):** [https://pf-tweet-frontend.onrender.com](https://pf-tweet-frontend.onrender.com)
* **Repositório GitHub:** [https://github.com/jpnune/PF-tweet](https://github.com/jpnune/PF-tweet)

---

## 🛠️ Tecnologias Utilizadas

### Backend
* **Python 3.11** & **Django 4.2+**
* **Django REST Framework (DRF)** para a construção da API REST
* **Simple JWT** para autenticação segura baseada em tokens JSON Web Tokens
* **PostgreSQL** (banco de dados em produção) & **SQLite** (banco de dados em desenvolvimento local)
* **Gunicorn** & **Whitenoise** para servir os arquivos estáticos e aplicação em produção

### Frontend
* **React 19** com **TypeScript** & **Vite**
* **React Router Dom** para controle de rotas
* **Lucide React** para iconografia
* **Axios** para requisições HTTP integradas ao backend com interceptores para injeção automática de tokens

---

## 📋 Funcionalidades Implementadas

### 1. Configuração de Perfil Flexível 👤
* Cada usuário possui um perfil (`Profile`) atrelado à sua conta, criado automaticamente no momento do cadastro por meio de Django Signals.
* O modal **"Editar Perfil"** na barra lateral do frontend permite alterar de forma independente e totalmente opcional:
  * **Nome de Exibição (Display Name)**.
  * **URL da foto de perfil (Avatar)**.
  * **Nova Senha** (tratada de forma segura pelo backend).
* Nenhuma alteração é obrigatória; o usuário tem total liberdade para editar apenas o campo que desejar.

### 2. Sistema de Seguir & Feed de Notícias 📰
* **Conexões**: Possibilidade de seguir e deixar de seguir qualquer usuário na plataforma.
* **Modais Interativos**: Visualização da lista de **Seguidores** e de usuários **Seguindo** com um simples clique nos contadores da barra lateral.
* **Feed Personalizado**: O feed de notícias principal exibe **apenas** as publicações das pessoas que você segue.
* **Feed Global**: Alternância para visualização global onde é possível descobrir novos usuários e posts em toda a rede.

### 3. Interações (Tweets, Likes, Retweets e Comentários) 💬
* **Publicação**: Criação de novos Chirps (limite de 280 caracteres).
* **Likes e Retweets**: Ações interativas em tempo real reativas no feed.
* **Comentários**: Seção de comentários retrátil em cada publicação para enviar e visualizar discussões imediatas.

---

## ⚙️ Como Executar Localmente

### Pré-requisitos
* Python 3.11 instalado.
* Node.js (versão 20 ou superior) instalado.

### Passo 1: Executando o Backend (Django)
1. Navegue até a pasta do backend:
   ```bash
   cd backend
   ```
2. Crie e ative um ambiente virtual:
   ```bash
   python -m venv venv
   # No Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # No Linux/macOS:
   source venv/bin/activate
   ```
3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
4. Execute as migrações do banco de dados (por padrão utilizará o SQLite localmente):
   ```bash
   python manage.py migrate
   ```
5. Inicie o servidor do Django:
   ```bash
   python manage.py runserver
   ```
   O backend estará acessível em `http://127.0.0.1:8000`.

### Passo 2: Executando o Frontend (React + Vite)
1. Abra um novo terminal e navegue até a pasta do frontend:
   ```bash
   cd frontend
   ```
2. Instale as dependências com npm:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   O frontend estará acessível em `http://localhost:5173`.

---

## 🧪 Executando Testes

### Testes do Backend (Django)
Para rodar os testes unitários do Django:
```bash
cd backend
python manage.py test
```

### Testes de UI/E2E (Playwright)
Para rodar a suíte de testes de ponta a ponta do Playwright no frontend:
```bash
cd frontend
npx playwright test
```
