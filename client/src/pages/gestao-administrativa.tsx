import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import GestaoOrcamentos from "./gestao-orcamentos";

function GestaoPublicacoes() {
  return <div data-testid="page-gestao-publicacoes"></div>;
}

function GestaoFaturamento() {
  return <div data-testid="page-gestao-faturamento"></div>;
}

function GestaoAdministrativo() {
  return <div data-testid="page-gestao-administrativo"></div>;
}

export default function GestaoAdministrativa() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (location === "/gestao-administrativa") {
      setLocation("/gestao-administrativa/orcamentos");
    }
  }, [location, setLocation]);

  return (
    <Switch>
      <Route path="/gestao-administrativa/orcamentos" component={GestaoOrcamentos} />
      <Route path="/gestao-administrativa/publicacoes" component={GestaoPublicacoes} />
      <Route path="/gestao-administrativa/faturamento" component={GestaoFaturamento} />
      <Route path="/gestao-administrativa/administrativo" component={GestaoAdministrativo} />
    </Switch>
  );
}
