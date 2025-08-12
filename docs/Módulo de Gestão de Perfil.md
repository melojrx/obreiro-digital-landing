# 📋 Módulo de Gestão de Perfil - Obreiro Virtual

## 📖 Visão Geral

O **Módulo de Gestão de Perfil** permite que o usuário logado gerencie completamente suas informações pessoais, dados da igreja e configurações de segurança através de uma interface moderna e intuitiva.

### 🎯 Objetivo
Centralizar todas as configurações e informações do usuário em um local único, oferecendo controle total sobre dados pessoais, informações da igreja e configurações de segurança.

---

## 🏗️ Arquitetura do Módulo

### 📁 Estrutura de Arquivos

```
frontend/src/
├── pages/
│   └── Perfil.tsx                    # Página principal do perfil
├── components/profile/
│   ├── PersonalDataForm.tsx          # Formulário de dados pessoais
│   ├── ChurchDataForm.tsx            # Formulário de dados da igreja
│   └── SecuritySettings.tsx          # Configurações de segurança
├── hooks/
│   └── useAuth.tsx                   # Hook de autenticação
└── services/
    └── auth.ts                       # Serviços de API

backend/apps/accounts/
├── views.py                          # Views dos endpoints
├── urls.py                           # URLs do módulo
├── models.py                         # Modelos de dados
└── serializers.py                    # Serializers da API
```

---

## 🔧 Funcionalidades Implementadas

### 1. 👤 **Gestão de Dados Pessoais**

#### ✨ Características
- **Interface moderna** com gradientes azul/indigo
- **Validações em tempo real** usando Zod
- **Máscaras automáticas** para formatação
- **Contadores de caracteres** para campos de texto
- **Indicadores visuais** de erro e sucesso

#### 📝 Campos Disponíveis
- **Nome Completo** (obrigatório)
- **Email** (obrigatório, validação única)
- **Telefone** (máscara: `(XX) XXXXX-XXXX`)
- **Data de Nascimento** (formato: `DD/MM/AAAA`)
- **Gênero** (Masculino/Feminino/Outro)
- **Biografia** (máximo 500 caracteres)

#### 🔗 Endpoint Backend
```http
PATCH /api/v1/users/update_personal_data/
```

#### 📊 Validações
- Nome completo: mínimo 2 caracteres
- Email: formato válido e único no sistema
- Telefone: formato brasileiro válido
- Data de nascimento: formato DD/MM/AAAA
- Biografia: máximo 500 caracteres

---

### 2. ⛪ **Gestão de Dados da Igreja**

#### ✨ Características
- **Interface moderna** com gradientes verde/emerald
- **Busca automática** de endereço por CEP
- **Validações específicas** para CNPJ e CEP
- **Formatação automática** de campos
- **Estados em maiúsculo** automático

#### 📝 Campos Disponíveis
- **Nome da Igreja** (obrigatório)
- **CNPJ** (máscara: `XX.XXX.XXX/XXXX-XX`)
- **Email da Igreja** (validação de formato)
- **Telefone** (máscara: `(XX) XXXXX-XXXX`)
- **CEP** (máscara: `XXXXX-XXX`, busca automática)
- **Endereço** (preenchimento automático via CEP)
- **Cidade** (preenchimento automático via CEP)
- **Estado** (preenchimento automático via CEP)

#### 🔗 Endpoints Backend
```http
PATCH /api/v1/users/update_church_data/
GET /api/v1/core/cep/<cep>/
```

#### 📊 Validações
- Nome da igreja: mínimo 2 caracteres
- CNPJ: formato válido (XX.XXX.XXX/XXXX-XX)
- Email: formato válido
- CEP: formato válido (XXXXX-XXX)
- Integração com API de CEP para validação

---

### 3. 📸 **Gestão de Avatar**

#### ✨ Características
- **Upload com preview** em tempo real
- **Validação de arquivos** (tipos e tamanho)
- **Processamento automático** de imagens
- **Cache-busting** para atualizações
- **Persistência entre sessões**

#### 📝 Especificações
- **Tipos aceitos**: JPEG, PNG, GIF, WebP
- **Tamanho máximo**: 5MB
- **Redimensionamento**: máximo 300x300px
- **Qualidade**: 85% (JPEG)
- **Formato de saída**: JPEG

#### 🔗 Endpoint Backend
```http
POST /api/v1/users/upload-avatar/
```

#### 🛠️ Processamento
1. Validação de tipo e tamanho
2. Redimensionamento automático
3. Conversão para RGB
4. Compressão com qualidade 85%
5. Timestamp para evitar cache
6. Remoção do avatar anterior

---

### 4. 🔐 **Configurações de Segurança**

#### ✨ Características
- **Alteração de senha** com validações robustas
- **Indicador de força** da senha em tempo real
- **Toggle de visibilidade** para campos de senha
- **Checklist de requisitos** da senha
- **Interface moderna** com gradientes vermelho/laranja

#### 📝 Validações de Senha
- **Mínimo 8 caracteres**
- **Pelo menos uma letra minúscula**
- **Pelo menos uma letra maiúscula**
- **Pelo menos um número**
- **Confirmação de senha** obrigatória

#### 🎨 Indicador de Força
- **Muito fraca** (0-1 critérios) - Vermelho
- **Fraca** (2 critérios) - Laranja
- **Regular** (3 critérios) - Amarelo
- **Forte** (4 critérios) - Azul
- **Muito forte** (5 critérios) - Verde

---

### 5. ⚠️ **Danger Zone - Exclusão de Conta**

#### ✨ Características
- **Interface de alerta** com tema vermelho
- **Confirmação dupla** obrigatória
- **Validação de senha** para segurança
- **Avisos claros** sobre irreversibilidade
- **Limpeza completa** de dados

#### 🚨 Processo de Exclusão
1. **Clique inicial** no botão "Deletar Minha Conta"
2. **Modal de confirmação** com avisos detalhados
3. **Campo de senha** obrigatório
4. **Validação no backend** da senha
5. **Exclusão permanente** com limpeza de dados
6. **Redirecionamento** para página inicial

#### 📋 Dados Removidos
- ✅ **Dados pessoais** e perfil completo
- ✅ **Avatar** e arquivos associados
- ✅ **Token de autenticação** ativo
- ✅ **Histórico de atividades**
- ✅ **Configurações personalizadas**
- ✅ **Relacionamentos** com igreja

#### 🔗 Endpoint Backend
```http
DELETE /api/v1/users/delete-account/
```

#### 🛡️ Validações de Segurança
- Senha atual obrigatória
- Confirmação de exclusão (`confirm_deletion: true`)
- Transação atômica para integridade
- Limpeza de arquivos no storage

---

## 🔄 Fluxos de Navegação

### 📍 Acesso ao Módulo
```
Dashboard → Sidebar → "Perfil" → Página de Perfil
```

### 📑 Abas Disponíveis
1. **Dados Pessoais** - Informações do usuário
2. **Dados da Igreja** - Informações da organização
3. **Segurança** - Senha e exclusão de conta

### 🔄 Fluxo de Edição
1. Usuário acessa aba desejada
2. Campos são preenchidos com dados atuais
3. Usuário modifica informações
4. Validações em tempo real
5. Botão "Salvar" habilitado
6. Envio para backend
7. Feedback de sucesso/erro
8. Atualização do estado global

---

## 🎨 Design e UX

### 🌈 Paleta de Cores
- **Dados Pessoais**: Gradiente azul/indigo
- **Dados da Igreja**: Gradiente verde/emerald
- **Segurança**: Gradiente vermelho/laranja
- **Danger Zone**: Tema vermelho de alerta

### 🎭 Componentes UI
- **Cards** com sombras e bordas suaves
- **Inputs** com foco e estados de erro
- **Buttons** com hover e animações
- **Alerts** para feedback e avisos
- **Modals** para confirmações críticas

### 📱 Responsividade
- **Layout adaptativo** para diferentes telas
- **Componentes flexíveis** com breakpoints
- **Navegação otimizada** para mobile
- **Formulários responsivos** com validações

---

## 🔧 Tecnologias Utilizadas

### 🎯 Frontend
- **React** 18+ com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **Shadcn/UI** para componentes
- **Zod** para validações
- **React Hook Form** para formulários
- **Sonner** para notificações

### 🔧 Backend
- **Django** 4+ com Python
- **Django REST Framework** para API
- **Pillow** para processamento de imagens
- **PostgreSQL** para banco de dados
- **Token Authentication** para segurança

### 🛠️ Integrações
- **API de CEP** para busca de endereços
- **Upload de arquivos** com validação
- **Processamento de imagens** automático
- **Cache-busting** para atualizações

---

## 🚀 Endpoints da API

### 👤 Usuário
```http
GET    /api/v1/users/me/                    # Dados do usuário
PATCH  /api/v1/users/update_personal_data/  # Atualizar dados pessoais
PATCH  /api/v1/users/update_church_data/    # Atualizar dados da igreja
POST   /api/v1/users/upload-avatar/         # Upload de avatar
DELETE /api/v1/users/delete-account/        # Deletar conta
```

### 🏢 Igreja
```http
GET /api/v1/users/my_church/  # Dados da igreja do usuário
```

### 🌐 Utilitários
```http
GET /api/v1/core/cep/<cep>/  # Buscar endereço por CEP
```

---

## 📊 Validações e Regras de Negócio

### 🔒 Segurança
- **Autenticação obrigatória** para todos os endpoints
- **Validação de propriedade** dos dados
- **Sanitização de inputs** no backend
- **Validação de tipos** de arquivo
- **Limitação de tamanho** de uploads

### 📝 Dados Pessoais
- **Email único** no sistema
- **Formato de telefone** brasileiro
- **Data de nascimento** válida
- **Biografia limitada** a 500 caracteres

### ⛪ Dados da Igreja
- **CNPJ válido** com formatação
- **CEP válido** com busca automática
- **Email válido** para contato
- **Endereço completo** obrigatório

### 🔐 Segurança
- **Senha atual** obrigatória para alterações
- **Força mínima** da nova senha
- **Confirmação** de senha obrigatória
- **Validação dupla** para exclusão de conta

---

## 🎯 Benefícios e Vantagens

### 👥 Para o Usuário
- **Interface intuitiva** e moderna
- **Validações em tempo real** 
- **Feedback imediato** de ações
- **Controle total** sobre dados
- **Segurança aprimorada**

### 🏢 Para a Organização
- **Dados sempre atualizados**
- **Validações automáticas**
- **Integridade de informações**
- **Backup automático**
- **Auditoria de alterações**

### 🔧 Para Desenvolvimento
- **Código modular** e reutilizável
- **Validações centralizadas**
- **API RESTful** bem documentada
- **Testes automatizados**
- **Manutenção facilitada**

---

## 📈 Métricas e Monitoramento

### 📊 Métricas Disponíveis
- **Uploads de avatar** por período
- **Atualizações de perfil** por usuário
- **Tentativas de exclusão** de conta
- **Erros de validação** mais comuns
- **Tempo de resposta** dos endpoints

### 🔍 Logs e Auditoria
- **Alterações de dados** pessoais
- **Uploads de arquivos** com timestamps
- **Tentativas de exclusão** de conta
- **Erros de validação** detalhados
- **Acessos aos endpoints** de perfil

---

## 🚀 Roadmap Futuro

### 🔄 Melhorias Planejadas
- [ ] **Histórico de alterações** do perfil
- [ ] **Backup automático** de dados
- [ ] **Integração com redes sociais**
- [ ] **Autenticação de dois fatores**
- [ ] **Exportação de dados** pessoais

### 🎨 Melhorias de UX
- [ ] **Modo escuro** para interface
- [ ] **Animações** mais suaves
- [ ] **Drag & drop** para avatar
- [ ] **Crop de imagem** integrado
- [ ] **Preview** antes de salvar

### 🔧 Melhorias Técnicas
- [ ] **Cache** de dados do perfil
- [ ] **Compressão** de imagens melhorada
- [ ] **Validação** de CNPJ online
- [ ] **Integração** com mais APIs de CEP
- [ ] **Testes** automatizados completos

---

## 📞 Suporte e Manutenção

### 🐛 Resolução de Problemas
- **Logs detalhados** para debugging
- **Validações específicas** para cada erro
- **Mensagens de erro** amigáveis
- **Rollback automático** em falhas
- **Monitoramento** de performance

### 🔧 Manutenção
- **Atualizações** regulares de dependências
- **Otimizações** de performance
- **Backup** regular de dados
- **Monitoramento** de uso
- **Documentação** sempre atualizada

---

## 📝 Conclusão

O **Módulo de Gestão de Perfil** representa uma solução completa e moderna para gerenciamento de dados pessoais e organizacionais no Obreiro Virtual. Com foco em **segurança**, **usabilidade** e **performance**, oferece aos usuários controle total sobre suas informações através de uma interface intuitiva e profissional.

A implementação segue as melhores práticas de desenvolvimento, garantindo **escalabilidade**, **manutenibilidade** e **segurança** em todos os aspectos do sistema.

---

*Documento gerado em: Janeiro 2025*  
*Versão: 1.0*  
*Autor: Equipe de Desenvolvimento Obreiro Virtual* 