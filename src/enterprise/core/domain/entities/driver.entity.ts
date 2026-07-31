/**
 * S.O.L.I.D. - Single Responsibility Principle (SRP)
 * Esta classe é responsável exclusivamente pelo domínio e validações das invariantes do Motorista (Driver).
 */
export class DriverEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string, // Multi-Tenant support
    public readonly name: string,
    public readonly cnh: string,
    public readonly cnhExpiry: string,
    public readonly cpf: string,
    public readonly contact: string,
    public readonly email: string,
    public readonly status: 'active' | 'blocked' | 'inactive',
    public readonly depositBalance: number
  ) {
    this.validate();
  }

  /**
   * Valida as invariantes do domínio (Regra de Negócio Crítica)
   */
  private validate(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('ID do motorista é obrigatório para persistência.');
    }
    if (!this.tenantId || this.tenantId.trim() === '') {
      throw new Error('Tenant ID é obrigatório para isolamento multi-tenant.');
    }
    if (!this.name || this.name.length < 3) {
      throw new Error('Nome do condutor deve conter pelo menos 3 caracteres.');
    }
    if (!this.validateCPF(this.cpf)) {
      throw new Error(`CPF informado (${this.cpf}) é inválido.`);
    }
    if (!this.email.includes('@')) {
      throw new Error('E-mail informado é inválido.');
    }
  }

  /**
   * Avalia robustamente se a CNH está vencida.
   */
  public isCnhExpired(currentDate: Date = new Date()): boolean {
    const expiry = new Date(this.cnhExpiry);
    return expiry.getTime() < currentDate.getTime();
  }

  /**
   * SRP Utility: Validador autossuficiente de formato e dígito verificador de CPF
   */
  private validateCPF(cpfString: string): boolean {
    const cleanCpf = cpfString.replace(/\D/g, '');
    if (cleanCpf.length !== 11) return false;
    
    // Evita CPFs conhecidos inválidos
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

    // Algoritmo de cálculo de dígitos verificadores
    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum = sum + parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum = sum + parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.substring(10, 11))) return false;

    return true;
  }
}
