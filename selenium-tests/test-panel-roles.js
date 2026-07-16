const { Builder, By, until } = require('selenium-webdriver');

async function probarRol(role, textoEsperado) {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    await driver.get('http://localhost:5173');

    // 🔥 INYECTAR USER Y TOKEN CORRECTAMENTE
    await driver.executeScript(`
      window.localStorage.setItem("token", "token-prueba");
      window.localStorage.setItem("user", JSON.stringify({
        id: 1,
        name: "Test",
        email: "test@test.com",
        role: "${role}"
      }));
    `);

    await driver.get('http://localhost:5173/panel');

    await driver.wait(until.elementLocated(By.tagName('body')), 10000);

    const bodyText = await driver.findElement(By.tagName('body')).getText();

    if (bodyText.includes(textoEsperado)) {
      console.log(`✅ Rol ${role}: muestra "${textoEsperado}"`);
    } else {
      console.log(`❌ Rol ${role}: no mostró "${textoEsperado}"`);
    }

    // 🔴 PAUSA PARA VER
    await driver.sleep(3000);

  } catch (error) {
    console.error(`❌ Error en rol ${role}:`, error.message);
  } finally {
    await driver.quit();
  }
}

(async function () {
  await probarRol('resident', 'Reportar incidente');
  await probarRol('committee', 'Publicar avisos');
  await probarRol('security', 'Atender incidentes');
  await probarRol('admin', 'Configuración');
})();