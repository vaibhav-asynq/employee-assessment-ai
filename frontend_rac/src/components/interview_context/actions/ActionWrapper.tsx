import { Card, CardContent } from "@/components/ui/card";

interface Props {
  children: React.ReactNode;
}

export function ActionWrapper({ children }: Props) {
  return (
    <Card>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}
