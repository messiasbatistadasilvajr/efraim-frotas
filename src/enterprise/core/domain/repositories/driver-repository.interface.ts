import { DriverEntity } from '../entities/driver.entity';

/**
 * D.I.P. - Dependency Inversion Principle (Abstrações não devem depender de detalhes. Detalhes devem depender de abstrações)
 * I.S.P. - Interface Segregation Principle (Interfaces enxutas e segregadas por domínio)
 */
export interface IDriverRepository {
  findById(id: string, tenantId: string): Promise<DriverEntity | null>;
  save(driver: DriverEntity): Promise<void>;
  updateBalance(id: string, tenantId: string, additionalAmount: number): Promise<void>;
  getAllActiveDrivers(tenantId: string): Promise<DriverEntity[]>;
}
