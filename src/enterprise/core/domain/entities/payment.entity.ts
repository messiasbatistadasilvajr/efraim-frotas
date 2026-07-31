/**
 * L.I.S.K.O.V. Substitution and Domain Invariants
 * Esta entidade valida rigorosamente as transações financeiras do sistema Efraim Frotas.
 */
export class PaymentEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly driverId: string,
    public readonly contractId: string,
    public readonly date: string,
    public readonly amount: number,
    public readonly type: 'weekly' | 'deposit' | 'repair' | 'fine' | 'earnings'
  ) {
    this.validate();
  }

  /**
   * Garante a integridade matemática da transação de caixa.
   */
  private validate(): void {
    if (!this.id) {
      throw new Error('Identificador da transação é obrigatório.');
    }
    if (!this.tenantId) {
      throw new Error('Tenant ID é obrigatório para transações de caixa.');
    }
    if (!this.driverId) {
      throw new Error('A transação deve obrigatoriamente estar vinculada a um motorista.');
    }
    if (!this.contractId) {
      throw new Error('A transação deve obrigatoriamente estar vinculada a um contrato ativo.');
    }
    if (this.amount <= 0 && this.type !== 'earnings') {
      throw new Error('O valor de pagamentos de despesa, aluguel ou caução deve ser estritamente maior que zero.');
    }
  }

  /**
   * Retorna se a transação representa crédito líquido de caixa.
   */
  public isCreditTransaction(): boolean {
    return ['weekly', 'deposit'].includes(this.type);
  }
}
