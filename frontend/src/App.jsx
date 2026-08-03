import React, { useState } from 'react';
import { CalendarCheck, Stethoscope, Syringe, QrCode } from 'lucide-react';
import Header from './components/Header';
import ServiceCard from './components/ServiceCard';
import TicketModal from './components/TicketModal';
import { createTicket } from './services/api';

/**
 * Componente Principal (App) do SUSpicious Totem
 * Orquestra o cabeçalho, o grid de seleção de serviços e os modais interativos.
 */
export default function App() {
  // Estado para armazenar o serviço atualmente selecionado no totem
  const [selectedService, setSelectedService] = useState(null);

  // Lista dos 4 Principais Serviços oferecidos no Totem da UBS
  const services = [
    {
      id: 'agendado',
      category: 'AGENDADO',
      title: 'Consultas Agendadas',
      description: 'Você já possui horário marcado com médico ou enfermeiro? Imprima seu direcionamento direto para a sala.',
      tag: 'e-SUS PEC Agendados',
      icon: <CalendarCheck size={36} />,
      iconBgClass: 'icon-blue',
    },
    {
      id: 'espontaneo',
      category: 'ESPONTANEO',
      title: 'Atendimento Espontâneo',
      description: 'Precisa de atendimento de acolhimento para sintomas ou queixas do dia? Retire sua senha para a triagem.',
      tag: 'Acolhimento / Demanda do Dia',
      icon: <Stethoscope size={36} />,
      iconBgClass: 'icon-emerald',
    },
    {
      id: 'vacinacao',
      category: 'VACINACAO',
      title: 'Sala de Vacinação',
      description: 'Atualização de caderneta de vacinação, doses de rotina ou campanhas de imunização.',
      tag: 'Imunização SUS',
      icon: <Syringe size={36} />,
      iconBgClass: 'icon-purple',
    },
    {
      id: 'triagem',
      category: 'TRIAGEM_DIGITAL',
      title: 'Triagem Digital (QR Code)',
      description: 'Agilize seu atendimento! Escaneie o QR Code no seu celular para preencher seus sintomas sem pegar fila.',
      tag: 'Pré-Atendimento Rápido',
      icon: <QrCode size={36} />,
      iconBgClass: 'icon-amber',
    },
  ];

  // Handler acionado quando o cidadão toca em um dos botões
  const handleServiceSelect = (service) => {
    setSelectedService(service);
  };

  // Handler que chama o serviço de API/Offline para emitir a senha
  const handleConfirmTicket = async (category, priority) => {
    return await createTicket(category, priority);
  };

  return (
    <div className="kiosk-container">
      {/* Cabeçalho com UBS, Relógio e Badge de Conexão */}
      <Header />

      {/* Banner de Boas-Vindas */}
      <section className="welcome-banner">
        <h1>Seja bem-vindo(a) à nossa Unidade!</h1>
        <p>Toque na tela abaixo para selecionar o serviço que você precisa hoje:</p>
      </section>

      {/* Grid com os 4 Cards Touchscreen */}
      <main className="services-grid">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            title={service.title}
            description={service.description}
            tag={service.tag}
            icon={service.icon}
            iconBgClass={service.iconBgClass}
            onClick={() => handleServiceSelect(service)}
          />
        ))}
      </main>

      {/* Modal Interativo de Emissão de Senha */}
      {selectedService && (
        <TicketModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onConfirm={handleConfirmTicket}
        />
      )}
    </div>
  );
}
