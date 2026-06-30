import { test, expect } from '@playwright/test';

test.describe('Validação de Inputs e Validações das Páginas', () => {

  test('Página de Login - Todos os inputs obrigatórios devem estar presentes', async ({ page }) => {
    await page.goto('/login');

    const usernameInput = page.locator('input[placeholder="Digite seu usuário"]');
    const passwordInput = page.locator('input[placeholder="Digite sua senha"]');
    const loginButton = page.locator('button[type="submit"]');

    // Verifica se os elementos estão visíveis
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();

    // Verifica se os campos possuem a tag 'required' nativa (campos obrigatórios)
    const isUsernameRequired = await usernameInput.evaluate(el => (el as HTMLInputElement).required);
    const isPasswordRequired = await passwordInput.evaluate(el => (el as HTMLInputElement).required);

    expect(isUsernameRequired).toBe(true);
    expect(isPasswordRequired).toBe(true);
  });

  test('Página de Cadastro - Todos os inputs obrigatórios devem estar presentes', async ({ page }) => {
    await page.goto('/signup');

    const usernameInput = page.locator('input[placeholder="Escolha um nome de usuário"]');
    const emailInput = page.locator('input[placeholder="Digite seu melhor e-mail"]');
    const passwordInput = page.locator('input[placeholder="Escolha uma senha forte"]');
    const signupButton = page.locator('button[type="submit"]');

    // Verifica se os elementos estão visíveis
    await expect(usernameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(signupButton).toBeVisible();

    // Todos os campos de cadastro devem ser obrigatórios
    const isUsernameRequired = await usernameInput.evaluate(el => (el as HTMLInputElement).required);
    const isEmailRequired = await emailInput.evaluate(el => (el as HTMLInputElement).required);
    const isPasswordRequired = await passwordInput.evaluate(el => (el as HTMLInputElement).required);

    expect(isUsernameRequired).toBe(true);
    expect(isEmailRequired).toBe(true);
    expect(isPasswordRequired).toBe(true);
  });

  test('Página de Feed - Validação de limite do campo de Tweet', async ({ page }) => {
    // Para acessar o feed precisamos fazer login antes
    // Vamos simular a existência de tokens fake ou redirecionamento direto,
    // mas já que o app valida a existência de 'access_token' no localStorage:
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'fake-token-e2e');
      localStorage.setItem('username', 'usuario_teste');
    });

    await page.goto('/');

    const tweetTextarea = page.locator('textarea[placeholder="O que está acontecendo?"]');
    const tweetButton = page.locator('button:has-text("Chirp")');

    await expect(tweetTextarea).toBeVisible();
    // O botão Chirp começa desabilitado porque a caixa está vazia
    await expect(tweetButton).toBeDisabled();

    // Digita texto válido
    await tweetTextarea.fill('Este é um tweet de teste da suíte de teste E2E.');
    await expect(tweetButton).toBeEnabled();

    // Excede o limite de caracteres de 280 para verificar se o botão desabilita
    const longText = 'a'.repeat(281);
    await tweetTextarea.fill(longText);
    await expect(tweetButton).toBeDisabled();
  });
});
