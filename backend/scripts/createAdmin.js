const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = "Admin112233@gmail.com";
    const password = "112233";

    // Check if admin exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("Admin already exists!");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword, 
        role: "ADMIN",
        isActive: true,
      },
    });

    await prisma.admin.create({
      data: {
        userId: user.id,
        firstName: "Admin",
        lastName: "TeleMed",
        permissions: ["ALL"],
      },
    });

    console.log("✅ Admin created successfully!");
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();