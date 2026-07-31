import { OrderTrackerLoader } from "@/components/pedido/order-tracker-loader";

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex flex-1 flex-col bg-background">
      <OrderTrackerLoader orderId={id} />
    </div>
  );
}
