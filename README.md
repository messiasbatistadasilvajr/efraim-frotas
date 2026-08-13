# 🚗 Efraim Frotas - ERP de Gestão Enterprise para Frotas de Aluguel (Parceiros Uber / 99)

**Efraim Frotas** é uma plataforma SaaS Enterprise de alta performance para gestão completa de frotas de locação de veículos focada em motoristas de aplicativo (Uber, 99, Indrive) e clientes corporativos.

O sistema combina inteligência operacional, dashboards financeiros detalhados, automação com n8n/WhatsApp, portal do investidor e alertas sonoros e de voz estilo e-commerce (Mercado Livre) em tempo real.

---

## 🌟 Principais Módulos do Sistema

### 1. 📊 Dashboard & Analytics Operacional
- Visão geral em tempo real da taxa de ocupação da frota.
- Indicadores de faturamento semanal/mensal, inadimplência e lucros líquidos.
- Gráficos interativos de desempenho financeiro e ocupação de veículos.

### 2. 🚘 Gestão de Frota & Telemetria
- Cadastro completo de veículos com placas, chassi, renavam e apólices de seguro.
- Histórico de revisões, troca de óleo, pneus e odômetro atualizado.
- Status operacional: *Disponível*, *Alugado*, *Em Manutenção*, *Aguardando Vistoria*.

### 3. 👥 Gestão de Motoristas & Ranking
- Cadastro detalhado de motoristas parceiros com foto e validação de CNH.
- Score de motorista baseado em pontualidade de pagamentos e cuidado com o veículo.
- Histórico de locações anteriores e ocorrências.

### 4. 📄 Contratos & Gestão de Caução
- Emissão e acompanhamento de contratos de locação semanal.
- Controle de caução (pago, parcelado ou pendente).
- Termos de aceite e histórico de renovações.

### 5. 🔔 Propostas & Orçamentos com Alertas de Som + Voz
- **Alertas estilo Mercado Livre**: Ao receber ou simular novas propostas de aluguel, o sistema aciona uma campainha sonora cristalina (*Ding-Dong*) e anuncia em voz alta em português (Web Speech API) o nome do cliente e veículo.
- Gerador de propostas em PDF com link direto para aceite via WhatsApp.
- Status de propostas: *Enviada*, *Aprovada*, *Negociando*, *Rejeitada*.

### 6. 📋 Kanban Operacional (Entregas e Manutenções)
- Quadro visual estilo Trello para acompanhar o ciclo de vida operacional.
- Colunas: *Novas Reservas*, *Vistoria de Saída*, *Veículo Entregue*, *Manutenção Agendada*, *Devoluções*.

### 7. 🏛️ Portal do Investidor
- Painel para investidores acompanharem o retorno das suas cotas de veículos.
- Cálculo de Yield mensal, repasses líquidos e relatórios consolidados em PDF/Excel.

### 8. 💰 Financeiro, DRE e Fluxo de Caixa
- Lançamentos de receitas (semanalidades) e despesas (manutenção, seguro, impostos).
- Demonstrativo de Resultados do Exercício (DRE) automático.
- Exportação de extratos e gráficos de fluxo de caixa.

### 9. 🚨 Gestão de Multas & CNH
- Registro de infrações de trânsito vinculadas ao motorista ativo na data/hora do evento.
- Controle de recurso de multas e repasse do valor do boleto para cobrança do motorista.

### 10. 📝 Checklists & Vistorias Cautelares Digitais
- Vistorias de entrega e devolução com mapa visual de avarias (pneus, lataria, nível de combustível, interior).
- Assinatura digital e relatório cautelar gerado instantaneamente.

### 11. ⚙️ Notificações Automáticas via n8n & WhatsApp
- Conectores configuráveis com webhooks n8n.
- Disparo automatizado de lembretes de cobrança de semanalidade via WhatsApp.
- Avisos automáticos de vencimento de CNH e revisões preventivas.

### 12. 🏢 Suíte Enterprise 360
- Alertas inteligentes de segurança e conformidade da frota.
- Sugestões preditivas para otimização de faturamento e substituição de peças.

---

## 🛠️ Arquitetura e Tecnologias Utilizadas

- **Frontend**: React 19 + TypeScript + Vite 6
- **Estilização**: Tailwind CSS 4 (Design System escuro/claro adaptativo de alto contraste)
- **Animações**: Motion (`motion/react`)
- **Iconografia**: Lucide React
- **Banco de Dados & Autenticação**: Firebase Firestore & Firebase Auth
- **Áudio & Voz**: Web Audio API (Campainha sintética) e Web Speech Synthesis API (Voz PT-BR)
- **Visualização de Dados**: Recharts

---

## 🚀 Como Rodar o Projeto na Sua Máquina

### Pré-requisitos
- **Node.js** v18+ instalado
- **npm** ou **yarn**

### Passo a Passo

1. **Clonar / Baixar o Código**:
   Extraia os arquivos do projeto em seu diretório de trabalho.

2. **Instalar as Dependências**:
   ```bash
   npm install
   ```

3. **Configuração de Variáveis de Ambiente (Opcional)**:
   Copie `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

4. **Iniciar o Servidor de Desenvolvimento**:
   ```bash
   npm run dev
   ```

5. **Acessar o App**:
   Abra seu navegador em `http://localhost:3000`.

---

## 📦 Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento Vite na porta 3000.
- `npm run build`: Compila a aplicação React para produção na pasta `dist/`.
- `npm run lint`: Executa a verificação de tipos com TypeScript (`tsc --noEmit`).

---

Desenvolvido para máxima eficiência na gestão de frotas de veículos.
