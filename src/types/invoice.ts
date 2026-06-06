export type Industry = 'TELCO' | 'INSURANCE' | 'BANKING';

export interface PendingInvoice {
  id: string;
  industry: Industry;
  provider: string;
  title: string;
  description: string;
  invoiceNumber: string;
  dueDate: string;
  amount: number;
  currency: 'VES' | 'USD';
  accountReference: string;
}

export interface DemoCustomer {
  cedula: string;
}
