import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Header from './components/Header';
import InactivityTimer from './components/InactivityTimer';

import Home from './pages/Home';
import InserirCPF from './pages/InserirCPF';
import ConfirmarPaciente from './pages/ConfirmarPaciente';
import SenhaGerada from './pages/SenhaGerada';
import QRCodeTriagem from './pages/QRCodeTriagem';
import PainelSenhas from './pages/PainelSenhas';
import ErrorPage from './pages/ErrorPage';
import ErrorPrinter from './pages/ErrorPrinter';
import TriagemMobile from './pages/TriagemMobile';

function App() {
  const location = useLocation();
  const isPainel = location.pathname === '/painel';

  const isMobile = location.pathname.startsWith('/triagem');

  if (isMobile) {
    return (
      <Routes location={location} key={location.pathname}>
        <Route path="/triagem/:id" element={<TriagemMobile />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      {/* O painel de TV não tem o header do totem */}
      {!isPainel && <Header />}

      <InactivityTimer timeoutMs={60000}>
        <main className={isPainel ? "" : "app-main"}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/cpf" element={<InserirCPF />} />
              <Route path="/confirmar" element={<ConfirmarPaciente />} />
              <Route path="/senha" element={<SenhaGerada />} />
              <Route path="/qrcode" element={<QRCodeTriagem />} />
              <Route path="/painel" element={<PainelSenhas />} />
              <Route path="/error-impressora" element={<ErrorPrinter />} />
              <Route path="*" element={<ErrorPage />} />
            </Routes>
          </AnimatePresence>
        </main>
      </InactivityTimer>
    </div>
  );
}

export default App;
