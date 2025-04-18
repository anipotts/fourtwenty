import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // Check if it's a multipart form request
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    // Using ImgBB's API for demo purposes
    // In a production app, you'd use a more robust solution like Cloudinary, AWS S3, etc.
    const imgbbApiKey =
      process.env.IMGBB_API_KEY || "8206ac51f84cf55a26908a117a6198bd"; // Demo key - please replace with your own

    // Create FormData for ImgBB
    const imgbbFormData = new FormData();
    imgbbFormData.append("key", imgbbApiKey);
    imgbbFormData.append("image", base64Image);

    // Send to ImgBB
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: imgbbFormData,
    });

    if (!response.ok) {
      throw new Error(`ImgBB API error: ${response.statusText}`);
    }

    const result = await response.json();

    // Return the image URL
    return NextResponse.json({
      success: true,
      url: result.data.url,
      display_url: result.data.display_url,
      thumbnail: result.data.thumb.url,
    });
  } catch (error: any) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image", message: error.message },
      { status: 500 }
    );
  }
}
