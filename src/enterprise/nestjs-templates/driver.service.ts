import { DriverEntity } from '../core/domain/entities/driver.entity';
import { CreateDriverDto } from './driver.controller';

/**
 * NestJS Service implementing DDD Business Orchestrations
 */
export class FakeDriverService {
  constructor(private readonly prismaClient: any) {}

  /**
   * Registra um motorista validando DDD Entities e gravando via Prisma
   */
  async registerDriver(tenantId: string, dto: CreateDriverDto): Promise<any> {
    // 1. Instancia Entidade de Domínio DDD para rodar validações de CPF, CNH e Invariantes (SOLID SRP)
    const entity = new DriverEntity(
      Math.random().toString(36).substring(2, 15),
      tenantId,
      dto.name,
      dto.cnh,
      dto.cnhExpiry,
      dto.cpf,
      dto.contact,
      dto.email,
      'active',
      0.00
    );

    // 2. Consulta duplicidade de CNH/CPF de forma segura no Prisma Database
    const existing = await this.prismaClient.driver.findFirst({
      where: {
        OR: [
          { cpf: entity.cpf },
          { cnh: entity.cnh }
        ]
      }
    });

    if (existing) {
      throw new Error('Já existe um condutor com este CPF ou CNH cadastrado no ecossistema.');
    }

    // 3. Persiste no postgres respeitando mapeamentos
    return this.prismaClient.driver.create({
      data: {
        id: entity.id,
        tenantId: entity.tenantId,
        name: entity.name,
        cnh: entity.cnh,
        cnhExpiry: new Date(entity.cnhExpiry),
        cpf: entity.cpf,
        contact: entity.contact,
        email: entity.email,
        status: entity.status,
        depositBalance: entity.depositBalance
      }
    });
  }

  /**
   * Resgata condutores ativos isolados pelo Tenant Logado
   */
  async listDrivers(tenantId: string): Promise<any[]> {
    return this.prismaClient.driver.findMany({
      where: {
        tenantId: tenantId
      },
      orderBy: {
        name: 'asc'
      }
    });
  }
}
