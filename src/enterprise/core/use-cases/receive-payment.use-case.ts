import { PaymentEntity } from '../domain/entities/payment.entity';
import { IDriverRepository } from '../domain/repositories/driver-repository.interface';

export interface ReceivePaymentInput {
  paymentId: string;
  tenantId: string;
  driverId: string;
  contractId: string;
  amount: number;
  type: 'weekly' | 'deposit' | 'repair' | 'fine' | 'earnings';
}

export interface ReceivePaymentOutput {
  success: boolean;
  transactionId: string;
  updatedBalance: number;
  message: string;
}

/**
 * UseCase: Recebimento de Lançamento Financeiro com Isolamento de Invariantes
 * Segue o padrão Interactor do Clean Architecture.
 */
export class ReceivePaymentUseCase {
  constructor(
    private readonly driverRepository: IDriverRepository
  ) {}

  public async execute(input: ReceivePaymentInput): Promise<ReceivePaymentOutput> {
    // 1. Valida Entidade de Caixa (Invariantes de Domínio)
    const payment = new PaymentEntity(
      input.paymentId,
      input.tenantId,
      input.driverId,
      input.contractId,
      new Date().toISOString(),
      input.amount,
      input.type
    );

    // 2. Busca Condutor Responsável na Camada de Persistência Abstrata (DIP)
    const driver = await this.driverRepository.findById(payment.driverId, payment.tenantId);
    if (!driver) {
      throw new Error(`Motorista ID ${payment.driverId} não foi localizado.`);
    }

    if (driver.status === 'blocked') {
      throw new Error('Não é possível receber lançamentos para um motorista bloqueado.');
    }

    // 3. Modifica Balanço de Caução se aplicável
    let newBalance = driver.depositBalance;
    if (payment.type === 'deposit') {
      newBalance += payment.amount;
      await this.driverRepository.updateBalance(driver.id, driver.tenantId, payment.amount);
    }

    // 4. Retorna confirmação isolada
    return {
      success: true,
      transactionId: payment.id,
      updatedBalance: newBalance,
      message: `Pagamento processado com sucesso. Tipo: ${payment.type}. Novo saldo de caução: R$ ${newBalance.toFixed(2)}.`
    };
  }
}
