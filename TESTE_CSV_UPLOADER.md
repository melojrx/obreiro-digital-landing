# Teste do CsvUploader - Debug Passo a Passo

## 🔍 Problema Relatado
Você reportou que não consegue clicar no componente CsvUploader, mas os testes automatizados com Playwright confirmam que o componente está funcional.

## ✅ O Que os Testes Confirmaram
1. ✅ O elemento tem `cursor: pointer`
2. ✅ O elemento tem handler `onclick` anexado
3. ✅ O elemento está visível e clicável (`isClickable: true`)
4. ✅ O file picker abre normalmente quando clicado no Playwright
5. ✅ Não há elementos sobrepondo o uploader

## 🧪 Teste Manual - Faça Agora

### Passo 1: Limpar Cache do Navegador
```bash
# Abra o navegador em modo anônimo/privado OU
# Pressione Ctrl+Shift+R para hard refresh
```

### Passo 2: Verificar no DevTools
1. Abra a página: http://localhost:5173/membros/importar
2. Pressione F12 para abrir DevTools
3. Vá na aba **Console**
4. Execute este comando:

```javascript
// Testar se o input file existe e pode ser clicado
const fileInput = document.querySelector('input[type="file"]');
console.log('File input encontrado:', fileInput);
console.log('Input está hidden:', fileInput?.className);
console.log('Input disabled:', fileInput?.disabled);

// Tentar clicar programaticamente
fileInput?.click();
```

**O que deve acontecer:** O file picker deve abrir imediatamente.

### Passo 3: Verificar o Div Wrapper
No Console do DevTools, execute:

```javascript
// Testar o div que envolve tudo
const uploaderDiv = document.querySelector('[data-testid="csv-input"]')?.parentElement;
console.log('Uploader div:', uploaderDiv);
console.log('Tem onclick:', uploaderDiv?.onclick);
console.log('Computed style:', window.getComputedStyle(uploaderDiv));

// Testar clique no div
uploaderDiv?.click();
```

**O que deve acontecer:** O file picker deve abrir.

### Passo 4: Verificar Eventos React
No Console:

```javascript
// Verificar se há listeners React
const uploaderDiv = document.querySelector('[data-testid="csv-input"]')?.parentElement;
const reactProps = Object.keys(uploaderDiv || {}).filter(k => k.startsWith('__react'));
console.log('React props keys:', reactProps);
```

### Passo 5: Simular Clique Manualmente
1. Abra DevTools (F12)
2. Clique na ferramenta "Selecionar elemento" (Ctrl+Shift+C)
3. Clique na área do uploader (onde diz "Arraste e solte...")
4. No DevTools, vai aparecer o elemento selecionado
5. Clique com botão direito → "Log properties"
6. Procure por propriedades relacionadas a eventos

## 🐛 Possíveis Causas do Problema

### Causa 1: Cache do Navegador
**Solução:** 
```bash
# Limpar cache do navegador ou usar modo anônimo
# Pressionar Ctrl+Shift+R (hard refresh)
```

### Causa 2: Dev Server Não Atualizou
**Solução:**
```bash
# Parar e reiniciar o Vite dev server
cd frontend
npm run dev
```

### Causa 3: Docker não refletiu mudanças
**Solução:**
```bash
# Reiniciar o container do frontend
docker-compose -f docker-compose.dev.yml restart frontend
```

### Causa 4: Extensões do Navegador
**Solução:**
- Desabilite temporariamente todas as extensões
- Ou use modo anônimo para testar

### Causa 5: Estado React Incorreto
**Solução:**
Verifique no React DevTools:
1. Instale React DevTools (extensão do navegador)
2. Abra a página
3. Vá na aba "Components"
4. Procure o componente `CsvUploader`
5. Verifique as props:
   - `disabled` deve ser `false`
   - `onFileSelect` deve ter uma função

## 📊 Resultado dos Testes Playwright

```javascript
{
  cursor: "pointer",              // ✅ Correto
  pointerEvents: "auto",         // ✅ Correto
  hasClickHandler: true,         // ✅ Correto
  isClickable: true,            // ✅ Correto
  visibility: "visible",        // ✅ Correto
}
```

**Resultado:** File picker abriu normalmente no teste automatizado.

## 🔧 Código Atual do CsvUploader

```typescript
// Linha ~66-70
const handleClick = () => {
  if (disabled) return;
  fileInputRef.current?.click();
};

// Linha ~94-103
<div
  onClick={handleClick}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
  className={cn(
    'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
    isDragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-200',
    disabled && 'opacity-50 cursor-not-allowed'
  )}
>
```

## 💡 Próximos Passos

1. **Execute os testes do Passo 2 e 3 acima** no Console do navegador
2. **Reporte os resultados** - cole aqui o que apareceu no console
3. Se o `fileInput?.click()` funcionar, o problema é com o handler onClick do React
4. Se não funcionar, o problema é com o input file em si

## ❓ Perguntas de Debug

1. Você está usando qual navegador? (Chrome, Firefox, Safari, etc.)
2. O erro aparece em todos os navegadores ou só em um específico?
3. Quando você clica na área, **algo acontece**? (mudança de cor, cursor, etc.)
4. Você consegue ver o cursor mudando para `pointer` quando passa o mouse?
5. Há algum erro no Console do navegador? (F12 → aba Console)

---

**IMPORTANTE:** O componente está tecnicamente correto e funcionando nos testes automatizados. O problema parece ser específico do ambiente local ou navegador.
