# 🔐 Guia de Segurança - Streaming Portfolio

## Resumo de Proteções Implementadas

### ✅ **Camada HTTP (Helmet)**
- **CSP (Content Security Policy)**: Restringe origem de scripts, estilos e iframes
  - Scripts: apenas do próprio domínio (`'self'`)
  - Iframes: apenas do YouTube
  - Imagens: domínio próprio + data URIs + HTTPS
  
- **HSTS**: Força HTTPS em produção (1 ano)

- **Framebusting**: Previne que site seja embutido em `<iframe>` alheio (`X-Frame-Options: sameorigin`)

- **No-Sniff**: Previne "MIME type sniffing" (`X-Content-Type-Options: nosniff`)

- **XSS Mitigation**: `X-XSS-Protection` (fallback para navegadores antigos)

- **Referrer Policy**: Não compartilha origem completa em requisições cross-domain

---

### ✅ **Autenticação**
- **Rate Limiting**: 10 tentativas de login por 15 minutos
- **Timing Attack Protection**: Comparação constant-time de credenciais
  - Mesmo que username não exista, leva o mesmo tempo para validar
- **Session Hardening**:
  - `httpOnly`: Impede acesso via JavaScript
  - `sameSite: "lax"`: Previne CSRF em links de terceiros
  - `secure`: HTTPS-only em produção
  - Expiração: 8 horas

---

### ✅ **Validação de Entrada (Backend)**
- **Joi Validation**:
  - Username: alfanumérico, 3-30 caracteres
  - Password: 6-50 caracteres
  - Catálogo: campos validados individualmente
  
- **Content-Type**: POST/PUT/DELETE exigem `application/json`

---

### ✅ **Prevenção de XSS (Frontend)**
- **textContent por padrão**: Dados dinâmicos via `textContent`, não `innerHTML`
- **Sanitização de URL**: URLs inseridas em CSS passam por validação
  - Aceita apenas `http://`, `https://`, `data:`
  - Rejeita `javascript:`, `vbscript:`, etc.

---

### ✅ **Rate Limiting**
- **Global**: 100 requisições/minuto por IP
  - Exceção: `/api/health` permite ilimitado
- **Login**: 10/15min conforme acima

---

### ✅ **Gerenciamento de Erros**
- **Não expõe Stack Trace**: Cliente recebe apenas `{ status, code, message }`
- **Logs Estruturados**: Servidor registra detalhes (nunca cliente)

---

### ✅ **Dados Sensíveis**
- **Chaves TMDB**: Armazenadas em `.env`, não versionadas
- **Credenciais Admin**: Variáveis de ambiente, não hardcoded
- **Respostas de API**: Nunca retornam senha ou tokens internos

---

## ⚠️ **Limitações & Contexto**

### O Projeto é um Portfolio + Admin
- **Não há multi-usuário**: Apenas 1 admin hardcoded (por design)
- **Deploy Local**: Tipicamente em `localhost:3000`
- **Sem Banco de Dados**: Dados em JSON, não sensível

### Recomendações para Production
Se você fizer deploy público:

1. **HTTPS Obrigatório**
   ```env
   NODE_ENV=production
   ```
   Helmet ativa automaticamente `secure` cookies + HSTS

2. **Chave TMDB Segura**
   - ✅ Configure `TMDB_BEARER_TOKEN` em variável de ambiente
   - ❌ Nunca exponha em commits
   - Use `.env.local` ou secrets do platform (Heroku, Railway, etc.)

3. **SESSION_SECRET Forte**
   ```bash
   # Gere um secret criptograficamente seguro
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Admin Password Forte**
   ```env
   ADMIN_USERNAME=seu_usuario_aleatorio
   ADMIN_PASSWORD=sua_senha_forte_aqui_32_chars_min
   ```

5. **Logs Centralizados**
   - Use serviço como Sentry ou CloudWatch
   - Monitorar erros sem expor detalhes em produção

6. **Backup de Dados**
   - `backend/data/catalog.json` é único arquivo de estado
   - Faça backup regularmente

---

## 🧪 **Testando Segurança Localmente**

### Teste 1: CSP em Ação
```bash
# Abra DevTools → Console
# Tente:
eval('alert("XSS")')
```
Resultado: ❌ Bloqueado por CSP (não executa)

### Teste 2: Rate Limit
```bash
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}'
   done
```
Resultado: ✅ Depois de 10 tentativas, retorna `TOO_MANY_REQUESTS`

### Teste 3: Content-Type Validation
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: text/plain" \
  -d '{"username":"admin","password":"test"}'
```
Resultado: ✅ Retorna `415 Unsupported Media Type`

### Teste 4: Timing Attack Protection
Compare tempo de resposta:
```bash
# Username errado
time curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"wronguser","password":"test"}'

# Username correto, password errada
time curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrongpass"}'
```
Resultado: ✅ Ambos devem levar ~mesmo tempo (constant-time comparison)

---

## 🚀 **Checklist Pré-Deploy**

- [ ] `NODE_ENV=production` configurado
- [ ] `HTTPS` habilitado (certificado válido)
- [ ] `SESSION_SECRET` é uma string criptograficamente forte (32+ bytes)
- [ ] `ADMIN_PASSWORD` é forte (não é `admin123`)
- [ ] `TMDB_BEARER_TOKEN` está em `.env` (não em código)
- [ ] `.env` está em `.gitignore`
- [ ] Logs são enviados para serviço centralizado
- [ ] Backup de `backend/data/catalog.json` configurado
- [ ] Rate limits revisados para seu caso de uso
- [ ] CSP revisada se adicionar novo conteúdo (fonts, scripts, etc.)
- [ ] Headers de segurança testados com https://securityheaders.com

---

## 📚 **Referências**

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Docs](https://helmetjs.github.io/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [CSP Playground](https://csp-evaluator.withgoogle.com/)
- [SecurityHeaders.com](https://securityheaders.com/)

---

**Última Atualização:** 21/03/2026
**Status:** Pronto para Deploy
