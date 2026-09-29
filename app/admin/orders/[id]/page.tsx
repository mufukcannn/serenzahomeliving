import { notFound } from "next/navigation";
import { OrderDetail } from "@/components/admin/order-detail";
import { getOrderDetailAccess, parseAdminRole } from "@/lib/admin-access";
import { getAdminOrderFromDatabase } from "@/lib/admin-orders";

export default async function AdminOrderDetailPage({ params, searchParams }: { params: { id: string }; searchParams?: { role?: string | string[] } }) {
  const order = await getAdminOrderFromDatabase(params.id);
  if (!order) notFound();
  const role = parseAdminRole(searchParams?.role);
  const access = getOrderDetailAccess(role);

  return <OrderDetail order={order} access={access} />;
}
