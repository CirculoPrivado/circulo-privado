const clientes = new Set();

const enviarEvento = (res, event, data) => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

const registrarCliente = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.flushHeaders?.();

  clientes.add(res);

  enviarEvento(res, "connected", {
    message: "Canal SSE de emergencias conectado"
  });

  const intervalo = setInterval(() => {
    enviarEvento(res, "ping", {
      time: new Date().toISOString()
    });
  }, 25000);

  req.on("close", () => {
    clearInterval(intervalo);
    clientes.delete(res);
    res.end();
  });
};

const emitirNuevaAlerta = (alerta) => {
  for (const cliente of clientes) {
    enviarEvento(cliente, "nueva-alerta", alerta);
  }
};

module.exports = {
  registrarCliente,
  emitirNuevaAlerta
};