import { useEffect, useRef, useState } from "react";
import { crearCheckoutPago, capturarPagoPayPal } from "../services/pagosService";

function loadPayPalScript(clientId) {
  return new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve(window.paypal);
      return;
    }

    const existingScript = document.querySelector("#paypal-sdk");

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.paypal));
      existingScript.addEventListener("error", () =>
        reject(new Error("No se pudo cargar PayPal"))
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=MXN`;
    script.async = true;

    script.onload = () => {
      if (window.paypal) {
        resolve(window.paypal);
      } else {
        reject(new Error("PayPal SDK cargó pero window.paypal no existe"));
      }
    };

    script.onerror = () => {
      reject(new Error("No se pudo cargar el SDK de PayPal"));
    };

    document.body.appendChild(script);
  });
}

export default function PayPalButton({ pagoId, onSuccess, onError }) {
  const paypalRef = useRef(null);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

    if (!clientId) {
      console.error("Falta VITE_PAYPAL_CLIENT_ID en Frontend/.env");
      return;
    }

    let active = true;

    loadPayPalScript(clientId)
      .then(() => {
        if (active) {
          setSdkReady(true);
        }
      })
      .catch((error) => {
        console.error("Error cargando PayPal:", error);
        if (onError) onError(error);
      });

    return () => {
      active = false;
    };
  }, [onError]);

  useEffect(() => {
    if (!sdkReady) return;
    if (!paypalRef.current) return;
    if (!window.paypal) return;

    paypalRef.current.innerHTML = "";

    const buttons = window.paypal.Buttons({
      style: {
        layout: "vertical",
        shape: "pill",
        label: "paypal",
      },

      createOrder: async () => {
        try {
          const response = await crearCheckoutPago({
            pagoId,
            proveedor: "paypal",
          });

          if (!response?.orderID) {
            throw new Error("PayPal no devolvió orderID");
          }

          return response.orderID;
        } catch (error) {
          console.error("Error createOrder PayPal:", error);
          if (onError) onError(error);
          throw error;
        }
      },

      onApprove: async (data) => {
        try {
          const response = await capturarPagoPayPal({
            pagoId,
            orderID: data.orderID,
          });

          if (onSuccess) onSuccess(response);
        } catch (error) {
          console.error("Error captureOrder PayPal:", error);
          if (onError) onError(error);
        }
      },

      onError: (error) => {
        console.error("Error SDK PayPal:", error);
        if (onError) onError(error);
      },
    });

    buttons.render(paypalRef.current);

    return () => {
      if (buttons.close) {
        buttons.close().catch(() => {});
      }
    };
  }, [sdkReady, pagoId, onSuccess, onError]);

  if (!import.meta.env.VITE_PAYPAL_CLIENT_ID) {
    return (
      <div className="alert alert-warning mb-0">
        PayPal no está configurado en el frontend.
      </div>
    );
  }

  return <div ref={paypalRef} />;
}