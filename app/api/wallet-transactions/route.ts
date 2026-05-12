import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { walletAddress } = await req.json();

    const apiKey = process.env.BSCSCAN_API_KEY;

    const url =
      `https://api.etherscan.io/v2/api?chainid=56` +
      `&module=account` +
      `&action=txlist` +
      `&address=${walletAddress}` +
      `&startblock=0` +
      `&endblock=99999999` +
      `&page=1` +
      `&offset=10` +
      `&sort=desc` +
      `&apikey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch wallet transactions" },
      { status: 500 }
    );
  }
}