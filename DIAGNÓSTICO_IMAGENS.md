# 🔍 Diagnóstico: Imagens do TMDB Não Aparecem

## 📋 O Que Mudou

Foi adicionado **debug automático** no backend para identificar por que as imagens não estão sendo retornadas:

### ✅ Melhorias Implementadas

**Backend (`backend/services/tmdb.service.js`):**
- ✅ Logs detalhados quando `poster_path` está vazio
- ✅ Mensagem de erro crítica se nenhuma imagem for encontrada
- ✅ Debug de cache e contagem de itens com imagem

**Server (`server.js`):**
- ✅ Validação na inicialização se chave TMDB está configurada
- ✅ Mensagem clara de erro se faltar chave

**Frontend (`public/js/script.js`):**
- ✅ Alerta se TMDB retornar 0 itens
- ✅ Sugestão de verificar console do servidor

---

## 🚀 Como Diagnosticar o Problema

### **Passo 1: Inicie o servidor em modo desenvolvimento**
```bash
npm run dev
```

Observe a saída do terminal. Se você ver algo como:
```
❌ ERRO CRÍTICO: CATALOG_SOURCE=tmdb mas nenhuma chave foi configurada!
```

➜ **Você precisa configurar sua chave TMDB no `.env`**

### **Passo 2: Configure a Chave TMDB**

Crie ou edite o arquivo `.env` na raiz do projeto:

```env
CATALOG_SOURCE=tmdb
TMDB_BEARER_TOKEN=seu_bearer_token_aqui
# OU (se preferir API key)
# TMDB_API_KEY=seu_api_key_aqui

# Outros configs (opcionais)
SESSION_SECRET=dev_secret_123
TMDB_TIMEOUT_MS=8000
TMDB_AUTO_PAGES=2
CATALOG_LIMIT=20
```

**Onde conseguir a chave:**
1. Vá em [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
2. Crie uma conta (se não tiver)
3. Vá em "API" → "Settings"
4. Copie o **"Bearer Token (v4 auth)"** ou **"API Key (v3 auth)"**
5. Cole em seu `.env`

### **Passo 3: Reinicie o servidor**

```bash
# Ctrl+C para parar o servidor anterior
npm run dev
```

---

## 🔬 Lendo os Logs de Debug

Quando o servidor está rodando, você verá mensagens como:

### ✅ **Sucesso**
```
✅ TMDB cache hit: all::::1::20
✅ TMDB retornou 20 itens válidos com imagem
```

### ⚠️ **Aviso (poster_path vazio)**
```
⚠ Item sem poster_path - TMDB ID: 12345, Título: Meu Filme
```
Se ver isso, significa que a TMDB retornou o filme mas **sem capa**.
➜ Verifique se sua chave está válida.

### ❌ **Erro Crítico (nenhuma imagem)**
```
❌ CRÍTICO: Nenhuma imagem foi encontrada!
Mapeados: 20, Com imagem: 0
Verifique se sua chave TMDB está válida e se o poster_path está sendo retornado.
```
➜ **Sua chave está inválida, expirada ou bloqueada.**

---

## 🛠️ Checklist de Solução

- [ ] Chave TMDB está no `.env`?
- [ ] Reiniciou o servidor após adicionar chave?
- [ ] Vê mensagens `✅ TMDB retornou X itens` no console?
- [ ] As imagens aparecem no site?
- [ ] Não vê mensagens de erro `❌ CRÍTICO`?

---

## 🔧 Problemas Comuns & Soluções

### **Problema 1: "Nenhuma imagem foi encontrada"**
**Causa Provável:** Chave TMDB inválida ou expirada

**Solução:**
1. Verifique se o token/key está correto no `.env`
2. Vá em [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
3. Regenere um novo token/key
4. Substitua no `.env` e reinicie

### **Problema 2: "Item sem poster_path" (muitos avisos)**
**Causa Provável:** Alguns filmes na TMDB não têm capa

**Solução:**
- Isso é normal em alguns cenários. O filtro automático remove itens sem imagem.
- Se muitos itens não têm imagem, sua busca pode estar retornando dados incompletos.
- Tente limpar o cache:
  ```bash
  # Reinicie o servidor (cache é em memória)
  npm run dev
  ```

### **Problema 3: "TMDB indisponível no momento"**
**Causa Provável:** API TMDB está lenta ou fora

**Solução:**
1. Tente novamente em alguns segundos
2. O sistema automaticamente cai para **fallback local** (catálogo em `backend/data/catalog.json`)
3. Verifique status em [https://status.themoviedb.org](https://status.themoviedb.org)

### **Problema 4: Chave não está sendo lida do `.env`**
**Causa Provável:** Variáveis de ambiente não foram recarregadas

**Solução:**
1. Feche o terminal/VS Code completamente
2. Abra VS Code de novo
3. Reinicie: `npm run dev`

---

## 📊 Verificação Final

**No navegador**, abra o **DevTools** (F12) → Aba **Network**:

1. Faça uma busca ou recarregue a página
2. Procure por uma chamada para `/api/catalog`
3. Veja a resposta JSON:
   ```json
   {
     "status": "success",
     "source": "tmdb",
     "data": [
       {
         "id": "tmdb-550",
         "title": "Clube da Luta",
         "image": "https://image.tmdb.org/t/p/w500/abcdef...",
         ...
       }
     ]
   }
   ```

**Se `image` estiver vazio (`""`):** ➜ Problema na chave ou na TMDB
**Se `source` for `"local-fallback"`:** ➜ TMDB falhou, usando catálogo local
**Se `source` for `"tmdb"` e images têm URLs:** ✅ Funcionando corretamente!

---

## 📝 Próximos Passos

Após resolver o problema de imagens:

1. **Limpar cache** (deletar arquivos `jest-*.txt`)
2. **Rodar testes** para confirmar: `npm test`
3. **Testar fluxo completo:**
   - Fazer login
   - Buscar filmes/séries
   - Adicionar favoritos
   - Verificar ratings

---

**Precisa de ajuda?** Compartilhe:
- A mensagem de erro exata do console (server)
- Screenshot do DevTools (Network tab)
- Seu `.env` (sem expor a chave! só confirme que está preenchido)
