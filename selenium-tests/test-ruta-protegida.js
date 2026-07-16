const { Builder, until } = require('selenium-webdriver');

(async function testRutaProtegida() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    // 🔴 BORRAR TOKEN ANTES
    await driver.get('http://localhost:5173');

    await driver.executeScript(`
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
    `);

    console.log('🧹 Token eliminado');

    // ⏳ PAUSA
    await driver.sleep(3000);

    // 🔥 INTENTAR ENTRAR AL PANEL
    await driver.get('http://localhost:5173/panel');

    // ⏳ ESPERAR REDIRECCIÓN
    await driver.wait(until.urlContains('/iniciar-sesion'), 10000);

    console.log('✅ Ruta protegida correcta');

    // ⏳ PAUSA PARA VER
    await driver.sleep(5000);

  } catch (error) {
    console.error('❌ Error:', error.message);

    await driver.sleep(5000);
  } finally {
    await driver.quit();
  }
})();