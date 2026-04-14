import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Garante que, ao navegar entre rotas, a janela volte ao topo (comportamento esperado de “nova página”).
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
