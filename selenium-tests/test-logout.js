const { Builder, By, until } = require('selenium-webdriver');

(async function testLogout() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    await driver.get('http://localhost:5173/iniciar-sesion');

    const emailInput = await driver.wait(
      until.elementLocated(By.css('input[type="email"]')),
      10000
    );

    const passwordInput = await driver.wait(
      until.elementLocated(By.css('input[type="password"]')),
      10000
    );

    await emailInput.sendKeys('residente.incidentes@correo.com');
    await passwordInput.sendKeys('123456');

    await driver.findElement(By.css('button[type="submit"]')).click();

    await driver.wait(until.urlContains('/panel'), 10000);

    console.log('✅ Login realizado');

    // ⏳ PAUSA PARA VER EL PANEL
    await driver.sleep(5000);

    const logoutButton = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Cerrar sesión')]")),
      10000
    );

    await logoutButton.click();

    console.log('🔓 Logout ejecutado');

    await driver.wait(until.urlContains('/iniciar-sesion'), 10000);

    // ⏳ PAUSA PARA VER LOGIN
    await driver.sleep(5000);

    const token = await driver.executeScript(
      'return window.localStorage.getItem("token");'
    );

    const user = await driver.executeScript(
      'return window.localStorage.getItem("user");'
    );

    if (!token && !user) {
      console.log('✅ Logout correcto: sesión eliminada');
    } else {
      console.log('❌ Logout falló: datos aún existen');
    }

    // ⏳ PAUSA FINAL (MUY IMPORTANTE)
    await driver.sleep(5000);

  } catch (error) {
    console.error('❌ Error:', error.message);

    await driver.sleep(5000);
  } finally {
    await driver.quit();
  }
})();