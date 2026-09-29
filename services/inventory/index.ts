import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { InventoryReservationInput, InventorySyncTarget } from "@/lib/inventory/types";

export class InventoryService {
  async reserve(input: InventoryReservationInput) {
    return prisma.$transaction(async (tx) => this.reserveWithTransaction(tx, input));
  }

  async reserveWithTransaction(tx: Prisma.TransactionClient, input: InventoryReservationInput) {
    const inventory = input.inventoryId
      ? await tx.inventory.findUnique({ where: { id: input.inventoryId } })
      : await tx.inventory.findUnique({ where: { sku: input.sku } });

    if (!inventory) throw new Error(`Inventory not found for ${input.sku}`);

    await tx.$queryRaw`SELECT id FROM "Inventory" WHERE id = ${inventory.id} FOR UPDATE`;

    const available = inventory.onHand - inventory.reserved - inventory.safety;
    if (available < input.quantity) throw new Error(`Insufficient stock for ${input.sku}`);

    await tx.inventory.update({
      where: { id: inventory.id },
      data: { reserved: { increment: input.quantity } }
    });

    return tx.inventoryReservation.create({
      data: {
        inventoryId: inventory.id,
        productId: input.productId,
        variantId: input.variantId,
        orderId: input.orderId,
        externalOrderId: input.externalOrderId,
        sku: input.sku,
        quantity: input.quantity,
        source: input.channel,
        status: "active",
        expiresAt: input.expiresAt
      }
    });
  }

  async commit(reservationId: string) {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.inventoryReservation.findUnique({ where: { id: reservationId } });
      if (!reservation || reservation.status !== "active") throw new Error("Active inventory reservation not found");

      await tx.$queryRaw`SELECT id FROM "Inventory" WHERE id = ${reservation.inventoryId} FOR UPDATE`;
      await tx.inventory.update({
        where: { id: reservation.inventoryId },
        data: {
          onHand: { decrement: reservation.quantity },
          reserved: { decrement: reservation.quantity }
        }
      });

      return tx.inventoryReservation.update({
        where: { id: reservation.id },
        data: { status: "committed", committedAt: new Date() }
      });
    });
  }

  async release(reservationId: string) {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.inventoryReservation.findUnique({ where: { id: reservationId } });
      if (!reservation || reservation.status !== "active") throw new Error("Active inventory reservation not found");

      await tx.inventory.update({
        where: { id: reservation.inventoryId },
        data: { reserved: { decrement: reservation.quantity } }
      });

      return tx.inventoryReservation.update({
        where: { id: reservation.id },
        data: { status: "released", releasedAt: new Date() }
      });
    });
  }

  async getAvailability(sku: string) {
    const inventory = await prisma.inventory.findUnique({ where: { sku } });
    if (!inventory) return null;
    return {
      sku,
      onHand: inventory.onHand,
      reserved: inventory.reserved,
      available: Math.max(0, inventory.onHand - inventory.reserved - inventory.safety)
    };
  }

  async syncMarketplaces(targets: InventorySyncTarget[]) {
    return Promise.allSettled(targets.map(async (target) => target));
  }
}

export const inventoryService = new InventoryService();
