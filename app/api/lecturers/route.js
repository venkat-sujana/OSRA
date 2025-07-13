// api/lecturers/route.js

import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import Lecturer from "@/models/Lecturer";
import College from "@/models/College"; // 👉 Import College model
import cloudinary from "@/lib/cloudinary";

export const config = {
  api: {
    bodyParser: false,
  },
};

export const dynamic = "force-dynamic";

// GET all lecturers
export async function GET() {
  await connectMongoDB();
  const lecturers = await Lecturer.find();
  return NextResponse.json(lecturers);
}

// POST: New Lecturer creation with photo upload and college name injection
export async function POST(req) {
  try {
    await connectMongoDB();

    const formData = await req.formData();
    const fields = Object.fromEntries(formData.entries());

    const file = formData.get("photo");
    let photoUrl = "";

    // ✅ Upload lecturer photo to Cloudinary
    if (file && typeof file === "object") {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;

      const cloudinaryResponse = await cloudinary.uploader.upload(base64Image, {
        folder: "lecturers",
      });

      photoUrl = cloudinaryResponse.secure_url;
    }

    // ✅ Step: Find college name from collegeId
    const college = await College.findById(fields.collegeId);
    console.log("📥 Form Fields:", fields);
    console.log("🏫 collegeId:", fields.collegeId);
    console.log("🏫 College from DB:", college?.name);
   
    if (!college) {
      return NextResponse.json(
        { status: "error", message: "Invalid College ID" },
        { status: 400 }
      );
    }
    
    

    // ✅ Step: Create lecturer with collegeName
    const lecturer = await Lecturer.create({
      ...fields,
      collegeName: college.name, // Add collegeName
      photo: photoUrl,
    });

    

    return NextResponse.json({ status: "success", data: lecturer }, { status: 201 });
  } catch (error) {
    console.error("Lecturer upload error:", error);
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}