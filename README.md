# 🚀 Modern Web Starter com Firebase Hosting

Uma estrutura moderna, limpa e de alta performance criada com **HTML5 Semântico**, **CSS3 com Design Tokens e Modo Escuro/Claro**, e **JavaScript Vanilla**, pré-configurada para publicação instantânea no **Firebase Hosting**.

---

## 📁 Estrutura do Projeto

```text
firebase-web-app/
├── .firebaserc          # Configuração de aliases e vínculo com o projeto Firebase
├── .gitignore           # Ignora caches locais do Firebase e logs
├── firebase.json        # Regras de hospedagem, diretório público, rewrites e cache
├── README.md            # Documentação e guia passo a passo
└── public/              # Pasta raiz servida pelo Firebase Hosting
    ├── 404.html         # Página de erro 404 customizada
    ├── index.html       # Aplicação principal responsiva
    ├── css/
    │   └── style.css    # Estilização com temas claro/escuro e micro-animações
    └── js/
        └── app.js       # Alternância de tema, persistência e interações
```

---

## 🛠️ Pré-requisitos

1. **[Node.js](https://nodejs.org/)** instalado (versão LTS recomendada).
2. Uma conta no **[Google Firebase Console](https://console.firebase.google.com/)**.

---

## ⚡ Passo a Passo: Do Zero ao Deploy

### 1. Instalar a Firebase CLI
Abra o seu terminal e instale a CLI do Firebase globalmente:

```bash
npm install -g firebase-tools
```

### 2. Autenticar no Firebase
Faça login com a sua conta Google:

```bash
firebase login
```
*Uma janela do navegador será aberta para autorizar o acesso.*

### 3. Vincular seu Projeto Firebase
Crie um projeto no [Firebase Console](https://console.firebase.google.com/) se ainda não tiver um. Em seguida, vincule-o ao seu código local:

```bash
firebase use --add
```
*Selecione o projeto correspondente na lista e defina o alias como `default`.*

> **Dica Alternativa**: Você também pode abrir o arquivo [`.firebaserc`](.firebaserc) e substituir `"seu-projeto-firebase-id"` pelo ID real do seu projeto.

### 4. Testar Localmente
Você pode emular o ambiente de hospedagem localmente antes de publicar:

```bash
firebase emulators:start --only hosting
```
ou de forma simples:
```bash
firebase serve --only hosting
```
Acesse `http://localhost:5000` no seu navegador.

### 5. Fazer Deploy para Produção
Para enviar seus arquivos para os servidores globais do Firebase:

```bash
firebase deploy --only hosting
```

Ao concluir, o terminal exibirá a URL pública do seu site (ex: `https://seu-projeto.web.app`).

---

## ⚙️ Configurações do `firebase.json`

O arquivo [`firebase.json`](firebase.json) já vem configurado com:
- **`public`: `"public"`**: Define a pasta que contém os arquivos estáticos.
- **`ignore`**: Impede que arquivos internos (como `.firebaserc`, logs e configs) sejam enviados para o servidor público.
- **`rewrites`**: Redireciona requisições para `index.html` (ideal caso decida expandir para Single Page Application com roteamento no cliente).
- **`headers`**: Otimização de cache para imagens, scripts e folhas de estilo (`Cache-Control: max-age=7200`).
