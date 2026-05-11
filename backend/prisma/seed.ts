import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password@123", 10);

  const [employee, manager, procurement, finance] = await Promise.all([
    prisma.user.upsert({
      where: { email: "employee1@acme.com" },
      update: {},
      create: {
        email: "employee1@acme.com",
        name: "Employee One",
        role: Role.EMPLOYEE,
        passwordHash,
      },
    }),
    prisma.user.upsert({
      where: { email: "manager1@acme.com" },
      update: {},
      create: {
        email: "manager1@acme.com",
        name: "Manager One",
        role: Role.MANAGER,
        passwordHash,
      },
    }),
    prisma.user.upsert({
      where: { email: "proc1@acme.com" },
      update: {},
      create: {
        email: "proc1@acme.com",
        name: "Procurement Admin",
        role: Role.PROCUREMENT,
        passwordHash,
      },
    }),
    prisma.user.upsert({
      where: { email: "finance1@acme.com" },
      update: {},
      create: {
        email: "finance1@acme.com",
        name: "Finance Admin",
        role: Role.FINANCE,
        passwordHash,
      },
    }),
  ]);

  const items = [
    { name: "Laptop", sku: "LAPTOP", totalStock: 2, availableStock: 2, reorderLevel: 1 },
    { name: "Monitor", sku: "MONITOR", totalStock: 5, availableStock: 5, reorderLevel: 2 },
    { name: "Keyboard", sku: "KEYBOARD", totalStock: 10, availableStock: 10, reorderLevel: 3 },
    { name: "Mouse", sku: "MOUSE", totalStock: 10, availableStock: 10, reorderLevel: 3 },
  ];

  for (const it of items) {
    await prisma.inventoryItem.upsert({
      where: { sku: it.sku },
      update: {
        name: it.name,
        totalStock: it.totalStock,
        availableStock: it.availableStock,
        reorderLevel: it.reorderLevel,
      },
      create: it,
    });
  }

  await prisma.vendor.upsert({
    where: { name: "Default Vendor" },
    update: {},
    create: { name: "Default Vendor", email: "sales@vendor.com", phone: "+1-555-0100" },
  });

  console.log("Seed completed:", {
    employee: employee.email,
    manager: manager.email,
    procurement: procurement.email,
    finance: finance.email,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

