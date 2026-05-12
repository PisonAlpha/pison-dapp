import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { guid } = await req.json();

    const apiKey = process.env.BSCSCAN_API_KEY;

    const formData = new URLSearchParams();

    formData.append("apikey", apiKey || "");
    formData.append("module", "contract");
    formData.append("action", "checkverifystatus");
    formData.append("guid", guid);

    const response = await fetch(
      "https://api.etherscan.io/v2/api?chainid=56",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

   

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Verification status check failed" },
      { status: 500 }
    );
  }
}