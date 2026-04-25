# Efraim Frotas - Gestão de Frotas para Parceiros Uber

Sistema profissional de gestão de frotas, focado em alta lucratividade, segurança e performance para proprietários de veículos em plataformas de transporte.

## 🚀 Como Rodar o Projeto Localmente

Siga os passos abaixo para configurar o ambiente de desenvolvimento em sua máquina:

1. **Instalar Dependências**
   ```bash
   npm install
   ```

2. **Configurar Variáveis de Ambiente**
   Crie um arquivo `.env.local` na raiz do projeto e adicione sua chave de API do Gemini (necessária para funcionalidades de IA se implementadas):
   ```env
   VITE_GEMINI_API_KEY=sua_chave_aqui
   ```
   *Nota: O projeto utiliza Firebase para banco de dados e autenticação. Certifique-se de configurar o Firebase no arquivo `src/lib/firebase.ts` ou utilizar o arquivo de configuração exportado.*

3. **Rodar o App**
   ```bash
   npm run dev
   ```
   O servidor iniciará em `http://localhost:3000`.

## 🛠️ Tecnologias Utilizadas

- **React 19** + **Vite 6**
- **TypeScript**
- **Tailwind CSS 4**
- **Motion** (para animações suaves)
- **Lucide React** (iconografia)
- **Firebase** (Firestore & Auth)
- **Recharts** (dashboards e análises)
- **Google Gemini SDK** (preparado para IA)

## 📋 Funcionalidades Principais

- **Monitoramento em Tempo Real**: Dashboard dinâmico com métricas de ROI.
- **Gestão de Frota**: Cadastro e acompanhamento de veículos com histórico de despesas.
- **Gestão de Motoristas**: Controle de motoristas, CNH e rankings de performance.
- **Contratos e Financeiro**: Gestão de locações, caução e pagamentos.
- **Alertas Inteligentes**: Monitoramento de vencimentos de documentos (Seguro, CNH, Licenciamento) com sistema de 'Snooze'.
- **Manutenção Proativa**: Alertas baseados em quilometragem e histórico de serviços.
- **Checklists Digitais**: Vistorias de entrega e devolução integradas aos contratos.

---
Desenvolvido para máxima eficiência na gestão de frotas.
