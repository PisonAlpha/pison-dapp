import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { tokenAddress } = await req.json();

    const apiKey = process.env.BSCSCAN_API_KEY;

    const holdersUrl =
      `https://api.etherscan.io/v2/api?chainid=56` +
      `&module=token` +
      `&action=tokenholdercount` +
      `&contractaddress=${tokenAddress}` +
      `&apikey=${apiKey}`;

    const transfersUrl =
      `https://api.etherscan.io/v2/api?chainid=56` +
      `&module=account` +
      `&action=tokentx` +
      `&contractaddress=${tokenAddress}` +
      `&page=1` +
      `&offset=10` +
      `&sort=desc` +
      `&apikey=${apiKey}`;

    const [holdersRes, transfersRes] =
      await Promise.all([
        fetch(holdersUrl),
        fetch(transfersUrl),
      ]);

    const holdersData = await holdersRes.json();
    const transfersData = await transfersRes.json();

    return NextResponse.json({
      holders: holdersData,
      transfers: transfersData,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to fetch token analytics",
      },
      {
        status: 500,
      }
    );
  }
}