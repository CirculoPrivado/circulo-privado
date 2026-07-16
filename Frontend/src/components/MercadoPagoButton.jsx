import { crearCheckoutPago } from "../services/pagosService";

export default function MercadoPagoButton({ pagoId, onError }) {
  const pagarConMercadoPago = async () => {
    try {
      const response = await crearCheckoutPago({
        pagoId,
        proveedor: "mercadopago",
      });

      const destino = response.initPoint || response.sandboxInitPoint;

      if (!destino) {
        throw new Error("Mercado Pago no devolvió una URL de checkout");
      }

      window.location.href = destino;
    } catch (error) {
      console.error("Error Mercado Pago:", error);
      if (onError) {
        onError(error);
      }
    }
  };

  return (
    <button
      type="button"
      className="btn btn-outline-primary boton-redondo"
      onClick={pagarConMercadoPago}
    >
      Pagar con Mercado Pago
    </button>
  );
}
