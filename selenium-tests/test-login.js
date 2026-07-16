const { Builder, By, until } = require('selenium-webdriver');

(async function testLogin() {
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

    console.log('✅ Login correcto');

    // 🔴 PAUSA PARA VER
    await driver.sleep(5000);

  } catch (error) {
    console.error('❌ Error:', error.message);

    // 🔴 PAUSA SI HAY ERROR
    await driver.sleep(5000);
  } finally {
    await driver.quit();
  }
})();