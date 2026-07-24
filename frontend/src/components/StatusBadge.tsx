import type { OrderStatus } from '../types';
import { STATUS_COLOR, STATUS_LABEL } from '../types';

// 国风订单状态徽标
export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`guo-tag ${STATUS_COLOR[status]}`}
      style={{
        letterSpacing: '0.15em',
        fontWeight: 600,
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
