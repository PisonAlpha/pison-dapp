import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
        contractAddress,
        contractName,
        compilerVersion,
        constructorArguments,
      } = body;

      const sourceCode = fs.readFileSync(
        path.join(process.cwd(), "verification", "PisonFlattened.sol"),
        "utf8"
      );

    const apiKey = process.env.BSCSCAN_API_KEY;
    

    const formData = new URLSearchParams();

    formData.append("apikey", apiKey || "");

    formData.append("module", "contract");

    formData.append("action", "verifysourcecode");

    formData.append("contractaddress", contractAddress);

    formData.append("sourceCode", sourceCode);

    formData.append("codeformat", "solidity-single-file");

    formData.append(
      "contractname",
      contractName
    );

    formData.append(
      "compilerversion",
      compilerVersion
    );

    formData.append(
      "optimizationUsed",
      "0"
    );

    formData.append("runs", "200");

    formData.append(
      "constructorArguements",
      constructorArguments || ""
    );

    
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
      {
        error: "Verification failed",
      },
      {
        status: 500,
      }
    );
  }
}