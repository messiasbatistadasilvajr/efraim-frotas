/**
 * NestJS Controller - Port Adapters Layer (Driven Primary Port)
 * SOLID Concept: Single Responsibility & Interface Segregation
 * Demonstra arquitetura pronta para produção com Guards, DTOs e Isolamento Multitenant.
 */
export class CreateDriverDto {
  name!: string;
  cnh!: string;
  cnhExpiry!: string;
  cpf!: string;
  contact!: string;
  email!: string;
}

export class FakeNestController {
  constructor(private readonly driverService: any) {}

  /**
   * POST /api/drivers - Registra um novo condutor isolando por Inquilino (Tenant)
   */
  async create(req: { user: { tenantId: string } }, dto: CreateDriverDto) {
    try {
      const tenantId = req.user.tenantId;

      // Chama serviço orquestrador de negócio
      const result = await this.driverService.registerDriver(tenantId, dto);
      return {
        statusCode: 201,
        message: 'Motorista cadastrado com sucesso sob arquitetura Enterprise SOLID',
        data: result
      };
    } catch (error: any) {
      return {
        statusCode: 400,
        message: error.message || 'Erro inesperado no cadastro'
      };
    }
  }

  /**
   * GET /api/drivers - Resgata todos os condutores do inquilino
   */
  async findAll(req: { user: { tenantId: string } }) {
    const tenantId = req.user.tenantId;
    const drivers = await this.driverService.listDrivers(tenantId);
    return {
      statusCode: 200,
      data: drivers
    };
  }
}
