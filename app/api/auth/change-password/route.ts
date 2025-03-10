import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/app/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export async function POST(request: Request) {
  try {
    const { token, oldPassword, newPassword } = await request.json();

    if (!token || !oldPassword || !newPassword) {
      return NextResponse.json(
        { error: "Token, old password, and new password are required." },
        { status: 400 }
      );
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Old password is incorrect." }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
