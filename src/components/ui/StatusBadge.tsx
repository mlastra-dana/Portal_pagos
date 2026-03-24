import type { ValidationStatus } from '../../types/validation';
import { cn } from '../../lib/utils';

const styles: Record<ValidationStatus, string> = {
  APROBADO: 'bg-success/10 text-success border-success/30',
  OBSERVADO: 'bg-warning/10 text-warning border-warning/30',
  RECHAZADO: 'bg-danger/10 text-danger border-danger/30',
};

export const StatusBadge = ({ status }: { status: ValidationStatus }) => {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide', styles[status])}>
      {status}
    </span>
  );
};
