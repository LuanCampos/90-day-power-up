import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: rota inexistente:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-sm text-center"
      >
        <h1 className="mb-2 font-display text-4xl font-bold text-foreground">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">Página não encontrada.</p>
        <Button variant="cta" asChild>
          <Link to="/">Voltar ao início</Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
