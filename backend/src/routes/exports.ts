import { Router } from "express";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../lib/auth";
import { Role } from "@prisma/client";
import { param } from "../lib/params";

export const exportsRouter = Router();

exportsRouter.get(
  "/purchase-orders/:id/receipt.pdf",
  requireAuth,
  requireRole([Role.PROCUREMENT, Role.FINANCE]),
  async (req, res) => {
    const id = param(req, "id");
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { vendor: true, items: { include: { item: true } } },
    });
    if (!po) return res.status(404).json({ error: "PO not found" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="purchase-receipt-${po.id}.pdf"`);

    const doc = new PDFDocument({ margin: 48 });
    doc.pipe(res);

    doc.fontSize(18).text("Purchase Receipt", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Order ID: ${po.id}`);
    doc.text(`Vendor Name: ${po.vendor.name}`);
    doc.text(`Status: ${po.status}`);
    doc.text(`Delivery Date: ${po.deliveryDate ? po.deliveryDate.toISOString().slice(0, 10) : "-"}`);
    doc.moveDown();

    doc.fontSize(13).text("Items", { underline: true });
    doc.moveDown(0.5);

    let grand = 0;
    for (const it of po.items) {
      grand += it.totalCost;
      doc.fontSize(12).text(`Asset Name: ${it.item.name}`);
      doc.text(`Quantity: ${it.quantity}`);
      doc.text(`Unit Cost: ${it.unitCost}`);
      doc.text(`Total Cost: ${it.totalCost}`);
      doc.moveDown();
    }

    doc.fontSize(12).text(`Grand Total: ${grand}`, { align: "right" });
    doc.end();
  },
);

exportsRouter.get(
  "/purchase-history.xlsx",
  requireAuth,
  requireRole([Role.PROCUREMENT, Role.FINANCE]),
  async (_req, res) => {
    const pos = await prisma.purchaseOrder.findMany({
      include: { vendor: true, items: { include: { item: true } }, invoice: true },
      orderBy: { createdAt: "desc" },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Purchase History");
    ws.columns = [
      { header: "Asset Name", key: "assetName", width: 24 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Cost", key: "cost", width: 12 },
      { header: "Vendor", key: "vendor", width: 22 },
      { header: "Payment Status", key: "paymentStatus", width: 14 },
      { header: "Order ID", key: "orderId", width: 30 },
      { header: "PO Status", key: "poStatus", width: 12 },
    ];

    for (const po of pos) {
      for (const it of po.items) {
        ws.addRow({
          assetName: it.item.name,
          quantity: it.quantity,
          cost: it.totalCost,
          vendor: po.vendor.name,
          paymentStatus: po.invoice?.paymentStatus ?? "PENDING",
          orderId: po.id,
          poStatus: po.status,
        });
      }
    }

    ws.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", 'attachment; filename="purchase-history.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  },
);

