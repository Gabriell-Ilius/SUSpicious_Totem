import React from 'react';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container">
          <span className="logo-icon">🏥</span>
          <h1>SUSpicious Totem</h1>
        </div>
        <p className="subtitle">Autoatendimento para Unidades Básicas de Saúde</p>
      </header>

      <main className="app-main">
        <div className="status-card">
          <div className="status-icon">🚧</div>
          <h2>Sistema em Construção</h2>
          <p>
            O totem de autoatendimento está sendo desenvolvido.
            <br />
            Em breve: consultas, vacinação e triagem digital.
          </p>
          <div className="tech-badges">
            <span className="badge">FastAPI</span>
            <span className="badge">React</span>
            <span className="badge">SQLite</span>
            <span className="badge">Raspberry Pi</span>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Biochallenge Brasil 2026 — Marco 0 (Fundação)</p>
      </footer>
    </div>
  );
}

export default App;
