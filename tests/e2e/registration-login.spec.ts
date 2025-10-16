import { expect, test } from '@playwright/test';

const generateCpf = (): string => {
  const digits: number[] = Array.from({ length: 9 }, () => Math.floor(Math.random() * 9));

  const computeCheckDigit = (numbers: number[]): number => {
    const sum = numbers.reduce((acc, digit, index) => acc + digit * (numbers.length + 1 - index), 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const firstCheckDigit = computeCheckDigit(digits);
  const secondCheckDigit = computeCheckDigit([...digits, firstCheckDigit]);
  const fullCpf = [...digits, firstCheckDigit, secondCheckDigit];

  return `${fullCpf.slice(0, 3).join('')}.${fullCpf.slice(3, 6).join('')}.${fullCpf
    .slice(6, 9)
    .join('')}-${fullCpf.slice(9).join('')}`;
};

const generatePhone = (): string => {
  const suffix = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `11${suffix}`;
};

test('registro e login end-to-end', async ({ page }) => {
  const timestamp = Date.now();
  const email = `teste.automacao+${timestamp}@example.com`;
  const password = `Senha${timestamp}Aa!`;
  const cpf = generateCpf();
  const phone = generatePhone();

  await test.step('Etapa 1 - preencher dados pessoais', async () => {
    await page.goto('/cadastro', { waitUntil: 'networkidle' });

    await page.fill('input[name="full_name"]', 'Teste Automação Playwright');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="birth_date"]', '1990-01-01');
    await page.selectOption('select[name="gender"]', 'M');
    await page.fill('input[name="cpf"]', cpf);
    await page.fill('input[name="phone"]', phone);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="password_confirm"]', password);
    await page.locator('input[name="accept_terms"]').check();

    await page.getByRole('button', { name: /continuar/i }).click();
    await page.waitForURL('**/cadastro/etapa-2', { timeout: 20_000 });
  });

  await test.step('Etapa 2 - preencher dados da igreja', async () => {
    await page.waitForFunction(() => {
      const select = document.querySelector<HTMLSelectElement>('select[name="denomination_id"]');
      return !!select && Array.from(select.options).some((option) => option.value && option.value.trim() !== '');
    }, undefined, { timeout: 15_000 });
    await page.selectOption('select[name="denomination_id"]', { value: '1' });

    await page.fill('input[name="user_zipcode"]', '01001-000');
    await page.fill('input[name="user_address"]', 'Praça da Sé');
    await page.fill('input[name="user_number"]', '100');
    await page.fill('input[name="user_neighborhood"]', 'Sé');
    await page.fill('input[name="user_city"]', 'São Paulo');
    await page.fill('input[name="user_state"]', 'SP');
    await page.fill('input[name="user_complement"]', 'Sala 10');

    await page.getByRole('button', { name: /avançar|continuar|próxima/i }).click().catch(async () => {
      // Fallback: botão de submissão principal quando label é "Continuar"
      await page.getByRole('button', { name: /continuar/i }).last().click();
    });

    await page.waitForURL('**/cadastro/etapa-3', { timeout: 20_000 });
  });

  await test.step('Etapa 3 - escolher plano e finalizar cadastro', async () => {
    await expect(page.getByRole('heading', { name: /Escolha seu plano/i })).toBeVisible();
    const basicPlanCard = page.locator('div.cursor-pointer', {
      has: page.getByRole('heading', { name: 'Básico' }),
    });
    await basicPlanCard.first().click();
    await page.getByRole('button', { name: /Começar gratuitamente/i }).click();
    await page.waitForURL('**/onboarding', { timeout: 25_000 });
    await expect(page.getByRole('heading', { name: /Bem-vindo/i })).toBeVisible();
  });

  await test.step('Efetuar login com as credenciais recém criadas', async () => {
    await page.evaluate(() => window.localStorage.clear());
    await page.context().clearCookies();

    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.getByRole('button', { name: /Entrar na Plataforma/i }).click();
    await page.waitForURL('**/onboarding', { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: /Bem-vindo/i })).toBeVisible();
  });

  test.info().annotations.push({ type: 'usuário', description: email });
  test.info().annotations.push({ type: 'senha', description: password });
  console.log(`[Playwright] Usuário criado: ${email} | Senha: ${password}`);
});
