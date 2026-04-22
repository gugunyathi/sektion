import { TableType, TABLE_TYPE_META } from "@/data/tables";
import { cn } from "@/lib/utils";
import { Crown, Heart, Sparkles, Users2 } from "lucide-react";

const ICON: Record<TableType, React.ComponentType<{ className?: string }>> = {
  mixed: Users2,
  gender_ratio: Users2,
  lgbtq: Sparkles,
  couples: Heart,
  host_pays: Crown,
};

export const TableTypeBadge = ({
  type,
  className,
  long = false,
}: {
  type: TableType;
  className?: string;
  long?: boolean;
}) => {
  const meta = TABLE_TYPE_META[type];
  const Icon = ICON[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        meta.tone,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {long ? meta.label : meta.short}
    </span>
  );
};
