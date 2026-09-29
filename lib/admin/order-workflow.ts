import { AdminOrder } from "@/lib/admin-data";

export const orderWorkflow: AdminOrder["orderStatus"][] = ["created", "processing", "preparing", "shipped", "delivered"];

export const shipmentWorkflow: AdminOrder["shipmentStatus"][] = ["not_ready", "label_created", "in_transit", "delivered", "exception"];

export function canTransitionOrder(current: AdminOrder["orderStatus"], next: AdminOrder["orderStatus"]) {
  const currentIndex = orderWorkflow.indexOf(current);
  const nextIndex = orderWorkflow.indexOf(next);
  return nextIndex >= currentIndex && nextIndex <= currentIndex + 1;
}

export function getNextOrderStatus(current: AdminOrder["orderStatus"]) {
  const index = orderWorkflow.indexOf(current);
  return orderWorkflow[Math.min(index + 1, orderWorkflow.length - 1)];
}

export type OrderWorkflowEvent = {
  orderId: string;
  from: AdminOrder["orderStatus"];
  to: AdminOrder["orderStatus"];
  actor: "admin" | "system" | "marketplace";
  note?: string;
};
