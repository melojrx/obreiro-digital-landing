# 📋 PLANO DE IMPLEMENTAÇÃO: Upload em Lote de Membros

## 🎯 Objetivo
Permitir que igrejas que já possuem uma lista de membros possam cadastrá-los em lote via upload de arquivo CSV/TXT, respeitando todas as regras de negócio, multi-tenant e permissões do sistema.

---

## 📊 ANÁLISE DA ESTRUTURA ATUAL

### **Modelo Member** - Campos Principais
**Obrigatórios:**
- `church` (ForeignKey - automático via tenant)
- `full_name` (CharField)
- `birth_date` (DateField)
- `phone` (CharField - validação via phone_validator)

**Opcionais mas Importantes:**
- `branch` (ForeignKey - pode ser matriz por padrão)
- `email` (EmailField - único por igreja)
- `cpf` (CharField - único por denominação, validação via validate_cpf)
- `gender`, `marital_status`, `membership_status`, `ministerial_function`
- Endereço completo, documentos, dados familiares

### **Relacionamentos Multi-Tenant**
- ✅ `church` → Igreja principal (isolamento tenant)
- ✅ `branch` → Filial específica (opcional, default matriz)
- ✅ Validações respeitam escopo por denominação (CPF) e igreja (email)

### **Validações Críticas**
1. CPF único por denominação (validação em serializer)
2. Email único por igreja (validação em serializer)
3. Telefone obrigatório com formato brasileiro
4. Data nascimento < hoje (não pode ser futura)
5. Branch deve pertencer à mesma igreja

---

## 🏗️ ARQUITETURA DA SOLUÇÃO

### **1. Backend (Django REST Framework)**

#### **1.1. Novo Serializer: `MemberBulkUploadSerializer`**
```python
# backend/apps/members/serializers.py

class MemberBulkUploadSerializer(serializers.Serializer):
    """
    Serializer para upload em lote de membros via CSV.
    Validação row-by-row com relatório de erros detalhado.
    """
    file = serializers.FileField(
        help_text="Arquivo CSV com dados dos membros"
    )
    branch_id = serializers.IntegerField(
        required=False,
        help_text="ID da filial (opcional, usa matriz se não informado)"
    )
    skip_duplicates = serializers.BooleanField(
        default=True,
        help_text="Pular membros duplicados (CPF/email existentes)"
    )
```

#### **1.2. Nova View: `bulk_upload` action no `MemberViewSet`**
```python
# backend/apps/members/views.py

@action(detail=False, methods=['post'], parser_classes=[MultiPartParser])
def bulk_upload(self, request):
    """
    Upload em lote de membros via arquivo CSV.
    
    Formato CSV esperado (separador ;):
    Nome Completo;CPF;Data Nascimento;Telefone;Email;Gênero;Estado Civil;...
    
    Retorna:
    - total_rows: Total de linhas processadas
    - success_count: Membros criados com sucesso
    - error_count: Linhas com erros
    - errors: Lista detalhada de erros por linha
    - duplicates_skipped: CPF/email duplicados ignorados
    """
```

#### **1.3. Service: `MemberBulkImportService`**
```python
# backend/apps/members/services.py (NOVO ARQUIVO)

class MemberBulkImportService:
    """
    Service para processar upload em lote de membros.
    Separa lógica de negócio da view.
    """
    
    def __init__(self, church, user, branch=None):
        self.church = church
        self.user = user
        self.branch = branch or self._get_default_branch()
    
    def process_csv(self, file, skip_duplicates=True):
        """Processa arquivo CSV e retorna relatório"""
        
    def _validate_row(self, row_data, line_number):
        """Valida uma linha do CSV"""
        
    def _create_member(self, validated_data):
        """Cria membro com dados validados"""
        
    def _check_duplicate(self, cpf, email):
        """Verifica duplicidade por CPF/email"""
```

---

### **2. Frontend (React + TypeScript)**

#### **2.1. Nova Página: `ImportarMembros.tsx`**
```typescript
// frontend/src/pages/ImportarMembros.tsx

export function ImportarMembros() {
  // Upload de arquivo + preview
  // Mapeamento de colunas (drag-and-drop)
  // Validação em tempo real
  // Relatório de importação
}
```

#### **2.2. Componente: `CsvUploader`**
```typescript
// frontend/src/components/members/CsvUploader.tsx

interface CsvUploaderProps {
  onUpload: (file: File) => void;
  maxSize?: number; // MB
  acceptedFormats?: string[];
}

export function CsvUploader({ onUpload, maxSize = 5 }: CsvUploaderProps) {
  // Drag & Drop zone
  // Validação de tamanho/formato
  // Preview de primeiras linhas
}
```

#### **2.3. Componente: `ImportReport`**
```typescript
// frontend/src/components/members/ImportReport.tsx

interface ImportReportProps {
  result: {
    total_rows: number;
    success_count: number;
    error_count: number;
    errors: ImportError[];
    duplicates_skipped: number;
  }
}

export function ImportReport({ result }: ImportReportProps) {
  // Tabela de erros por linha
  // Estatísticas visuais
  // Download de relatório em CSV
}
```

#### **2.4. Service: `membersService.bulkUpload()`**
```typescript
// frontend/src/services/membersService.ts

bulkUpload: async (file: File, branchId?: number, skipDuplicates = true) => {
  const formData = new FormData();
  formData.append('file', file);
  if (branchId) formData.append('branch_id', branchId.toString());
  formData.append('skip_duplicates', skipDuplicates.toString());
  
  const response = await api.post('/members/bulk_upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
}
```

---

## 📄 FORMATO DO CSV

### **Template Obrigatório**
```csv
Nome Completo;CPF;Data Nascimento;Telefone;Email;Genero;Estado Civil
João Silva;123.456.789-00;15/03/1985;(11) 98765-4321;joao@email.com;M;Casado(a)
Maria Santos;987.654.321-00;22/07/1990;(11) 91234-5678;maria@email.com;F;Solteiro(a)
```

### **Template Completo (Opcional)**
```csv
Nome Completo;CPF;RG;Data Nascimento;Genero;Estado Civil;Email;Telefone;Celular;CEP;Endereco;Numero;Complemento;Bairro;Cidade;Estado;Funcao Ministerial;Status Membresia;Data Membresia;Igreja Anterior;Profissao;Escolaridade
```

### **Mapeamento de Campos**
| Campo CSV | Campo Model | Obrigatório | Validação |
|-----------|-------------|-------------|-----------|
| Nome Completo | full_name | ✅ | String 3-200 chars |
| CPF | cpf | ❌ | Formato xxx.xxx.xxx-xx, único |
| Data Nascimento | birth_date | ✅ | DD/MM/AAAA, < hoje |
| Telefone | phone | ✅ | (XX) XXXXX-XXXX |
| Email | email | ❌ | email válido, único por igreja |
| Genero | gender | ❌ | M, F, O |
| Estado Civil | marital_status | ❌ | single, married, divorced, widowed |
| Funcao Ministerial | ministerial_function | ❌ | member, pastor, elder, etc. |

---

## 🔄 FLUXO DE EXECUÇÃO

### **Passo 1: Upload**
1. Usuário acessa página "Importar Membros"
2. Faz upload do arquivo CSV (drag & drop ou botão)
3. Frontend valida formato e tamanho
4. Mostra preview das primeiras 5 linhas

### **Passo 2: Configuração**
1. Usuário seleciona filial de destino (opcional)
2. Marca opção "Pular duplicados" (default: true)
3. Confirma importação

### **Passo 3: Processamento (Backend)**
1. Valida permissões (usuário pode criar membros?)
2. Valida filial (pertence à igreja ativa?)
3. Processa CSV linha por linha:
   - Parse dos dados
   - Validação de campos obrigatórios
   - Validação de formato (CPF, email, telefone)
   - Verificação de duplicidade
   - Criação do membro via `MemberCreateSerializer`
4. Coleta erros e sucessos

### **Passo 4: Relatório**
1. Backend retorna JSON com resultado
2. Frontend exibe relatório:
   - ✅ X membros criados
   - ⚠️ Y duplicados ignorados
   - ❌ Z erros (tabela detalhada)
3. Permite download do relatório em CSV

---

## 🛡️ VALIDAÇÕES E SEGURANÇA

### **Multi-Tenant**
- ✅ Todos os membros vinculados automaticamente à `church` ativa
- ✅ Validação de `branch` pertence à mesma `church`
- ✅ CPF único por **denominação** (não por igreja)
- ✅ Email único por **igreja**

### **Permissões**
- ✅ Apenas `CHURCH_ADMIN` e `SECRETARY` podem importar
- ✅ Secretário branch-aware: só pode importar para filiais gerenciadas
- ✅ Validação via `_user_can_write_branch()`

### **Performance**
- ✅ Limite de 1000 linhas por arquivo
- ✅ Processamento em batch de 100 (evita timeout)
- ✅ Transação atômica por membro (rollback em erro)
- ✅ Opcional: Celery task assíncrona para > 500 linhas

### **Auditoria**
- ✅ Log de importação (quem, quando, quantos)
- ✅ Histórico de status criado automaticamente via `MembershipStatusLog`
- ✅ Relatório de erros exportável

---

## 📦 ESTRUTURA DE ARQUIVOS

```
backend/apps/members/
├── models.py                  # Já existe
├── serializers.py             # + MemberBulkUploadSerializer
├── views.py                   # + bulk_upload action
├── services.py                # NOVO: MemberBulkImportService
└── utils.py                   # NOVO: parse_csv, validate_row

frontend/src/
├── pages/
│   └── ImportarMembros.tsx    # NOVO: Página principal
├── components/members/
│   ├── CsvUploader.tsx        # NOVO: Upload component
│   ├── ImportReport.tsx       # NOVO: Relatório
│   └── ColumnMapper.tsx       # NOVO: Mapear colunas CSV
├── services/
│   └── membersService.ts      # + bulkUpload()
└── types/
    └── import.ts              # NOVO: Tipos da importação

docs/
└── TEMPLATE_IMPORTACAO_MEMBROS.csv  # Template de exemplo
```

---

## 📈 ROADMAP DE IMPLEMENTAÇÃO

### **Fase 1: Backend Core** (Prioridade ALTA)
- [ ] Criar `MemberBulkImportService` com lógica de parse/validação
- [ ] Adicionar action `bulk_upload` no `MemberViewSet`
- [ ] Criar `MemberBulkUploadSerializer`
- [ ] Testes unitários de validação

### **Fase 2: Frontend Core** (Prioridade ALTA)
- [ ] Criar página `ImportarMembros.tsx`
- [ ] Componente `CsvUploader` com drag & drop
- [ ] Componente `ImportReport` com tabela de erros
- [ ] Integração com `membersService.bulkUpload()`

### **Fase 3: UX Avançada** (Prioridade MÉDIA)
- [ ] Mapeamento de colunas (arrastar para combinar)
- [ ] Preview com validação em tempo real
- [ ] Download de template CSV pré-formatado
- [ ] Progress bar para arquivos grandes

### **Fase 4: Performance** (Prioridade BAIXA)
- [ ] Celery task assíncrona para > 500 linhas
- [ ] Notificação por email quando concluído
- [ ] Cache de validações (CPFs/emails existentes)

---

## ⚠️ PONTOS DE ATENÇÃO

### **1. Encoding do CSV**
- Aceitar UTF-8 com BOM e ISO-8859-1 (Excel Brasil)
- Detectar automaticamente separador (`;` ou `,`)

### **2. Formatação de Dados**
- Telefone: aceitar vários formatos e normalizar
- CPF: aceitar com/sem pontuação
- Data: aceitar DD/MM/AAAA e AAAA-MM-DD
- Estado Civil: mapear variações ("Casado", "Casado(a)", "married")

### **3. Duplicidade**
- Priorizar CPF como chave primária de duplicação
- Se sem CPF, usar email + data nascimento
- Opção de atualizar ao invés de pular

### **4. Logs e Auditoria**
- Registrar cada importação no banco
- Manter histórico de arquivos importados
- Permitir reverter importação (soft delete)

---

## 🧪 TESTES NECESSÁRIOS

### **Backend**
```python
# tests/members/test_bulk_import.py

def test_bulk_upload_valid_csv():
    """Testa importação de CSV válido"""

def test_bulk_upload_duplicate_cpf():
    """Testa comportamento com CPF duplicado"""

def test_bulk_upload_invalid_phone():
    """Testa validação de telefone inválido"""

def test_bulk_upload_branch_permission():
    """Testa permissão branch-aware de secretário"""
```

### **Frontend**
```typescript
// tests/components/CsvUploader.test.tsx

describe('CsvUploader', () => {
  it('should accept valid CSV file')
  it('should reject file > 5MB')
  it('should show preview of first 5 rows')
})
```

---

## 📊 MÉTRICAS DE SUCESSO

- ✅ Importação de 1000 membros em < 30 segundos
- ✅ Taxa de erro < 5% em CSVs bem formatados
- ✅ 100% dos erros reportados com linha e motivo
- ✅ Zero duplicatas criadas
- ✅ 100% de respeito ao isolamento multi-tenant

---

## 🎯 RESUMO EXECUTIVO

**Complexidade:** Média
**Estimativa:** 3-5 dias de desenvolvimento
**Risco:** Baixo (sem alteração de modelos existentes)
**Impacto:** Alto (facilita onboarding de igrejas grandes)

**Tecnologias:**
- Python CSV parser (stdlib)
- Pandas (opcional, para CSVs complexos)
- React Dropzone (upload UX)
- Django transaction.atomic (integridade)

**Decisão Final:** ✅ Implementar com abordagem incremental, começando por Fase 1 e 2.

---

## 📝 NOTAS FINAIS

Este documento serve como guia completo para implementação da funcionalidade de upload em lote de membros. Cada fase pode ser implementada de forma independente, permitindo entregas incrementais e testes progressivos.

**Data de Criação:** 11 de novembro de 2025
**Versão:** 1.0
**Status:** Planejamento Completo ✅
