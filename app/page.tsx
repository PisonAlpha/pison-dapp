"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";



const contractAddress = "0x055E246DA1a858a4AA75988CA8c4b3511599a582";

const abi = [
  "function createSimpleToken(string name, string symbol, uint256 supply) payable",

  "function createAdvancedToken(string name, string symbol, uint256 supply, bool burnEnabled, uint256 buyTax, uint256 sellTax, uint256 maxWalletPercent, uint256 maxTxPercent) payable",

  "event TokenCreated(address tokenAddress, address tokenOwner, string tokenType, bool burnEnabled, uint256 buyTax, uint256 sellTax)"
];

   

  

export default function Home() {
  const [wallet, setWallet] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdToken, setCreatedToken] = useState("");
  const [tokenType, setTokenType] = useState("simple");
  const [buyTax, setBuyTax] = useState("");
  const [sellTax, setSellTax] = useState("");
  const [burnEnabled, setBurnEnabled] = useState(false);
  const [antiWhaleEnabled, setAntiWhaleEnabled] = useState(false);
  const [maxWalletPercent, setMaxWalletPercent] = useState("");
  const [maxTxPercent, setMaxTxPercent] = useState("");
  const [savedTokens, setSavedTokens] = useState<
  { name: string; address: string }[]
    >([]);
    const [showManageToken, setShowManageToken] =
      useState(false);

    const [managedToken, setManagedToken] =
      useState("");

      const [pairAddress, setPairAddress] =
        useState("");
        const [walletInput, setWalletInput] =
    useState("");
      const [walletBalance, setWalletBalance] =
        useState("");
      const [walletNetwork, setWalletNetwork] =
        useState("");
        const [networkSymbol, setNetworkSymbol] =
    useState("");
      const [selectedNetwork, setSelectedNetwork] =
      useState("bsc");
      const [walletType, setWalletType] =
    useState("");
      const [whaleAlert, setWhaleAlert] =
    useState("");
      const [activityScore, setActivityScore] =
    useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState("");
    const [verificationGuid, setVerificationGuid] = useState("");
    const [walletTxs, setWalletTxs] = useState<any[]>([]);
    const [loadingTxs, setLoadingTxs] = useState(false);
    const [tokenAnalytics, setTokenAnalytics] =
      useState<any>(null);

    const [loadingAnalytics, setLoadingAnalytics] =
      useState(false);
      const [launchNetwork, setLaunchNetwork] =
  useState("bsc");



  async function connectWallet() {
    try {
      if (!(window as any).ethereum) {

          const isMobile =
            /Android|iPhone|iPad|iPod/i.test(
              navigator.userAgent
            );

          if (isMobile) {

            window.location.href =
              "https://metamask.app.link/dapp/" +
              window.location.host;

            return;
          }

          alert("Install MetaMask");

          return;
        }

      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });

      setWallet(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  }

      async function createToken() {
      try {
        if (!(window as any).ethereum) {
          alert("Install MetaMask");
          return;
        }

        setLoading(true);

        const provider = new ethers.BrowserProvider(
          (window as any).ethereum
        );

        const signer = await provider.getSigner();

        const contract = new ethers.Contract(
          contractAddress,
          abi,
          signer
        );

      let tx;

        if (tokenType === "simple") {
          tx = await contract.createSimpleToken(
            name,
            symbol,
            supply,
            {
              value: ethers.parseEther("0.015"),
            }
          );
        } else {
          tx = await contract.createAdvancedToken(
            name,
            symbol,
            supply,
            burnEnabled,
            Number(buyTax || 0),
            Number(sellTax || 0),
            antiWhaleEnabled
              ? Number(maxWalletPercent || 100)
              : 100,
            antiWhaleEnabled
              ? Number(maxTxPercent || 100)
              : 100,
            {
              value: ethers.parseEther("0.05"),
            }
          );
        }

      const receipt = await tx.wait();

    const event = receipt.logs
      .map((log: any) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed: any) => parsed && parsed?.name === "TokenCreated");

    if (!event) {
      alert("Token created, but token address was not found.");
      return;
    }

    const tokenAddress = event.args.tokenAddress;
    console.log("TOKEN ADDRESS SENT TO VERIFY:", tokenAddress);

    setCreatedToken(tokenAddress);

          const existingTokens = JSON.parse(
            localStorage.getItem("pison_tokens") || "[]"
          );

          const newToken = {
            name,
            address: tokenAddress,
          };

          const updatedTokens = [newToken, ...existingTokens];

          localStorage.setItem(
            "pison_tokens",
            JSON.stringify(updatedTokens)
          );

          setSavedTokens(updatedTokens);
        
          await new Promise((resolve) =>
            setTimeout(resolve, 15000)
          );
        const signerAddress = await signer.getAddress();

    const constructorArguments =
      tokenType === "simple"
        ? ethers.AbiCoder.defaultAbiCoder()
            .encode(
              ["string", "string", "uint256", "address"],
              [name, symbol, supply, signerAddress]
            )
        .slice(2)
          : ethers.AbiCoder.defaultAbiCoder()
              .encode(
                [
                  "string",
                  "string",
                  "uint256",
                  "address",
                  "bool",
                  "uint256",
                  "uint256",
                  "uint256",
                  "uint256",
                ],
                [
                  name,
                  symbol,
                  supply,
                  signerAddress,
                  burnEnabled,
                  Number(buyTax || 0),
                  Number(sellTax || 0),
                  antiWhaleEnabled ? Number(maxWalletPercent || 100) : 100,
                  antiWhaleEnabled ? Number(maxTxPercent || 100) : 100,
                ]
              )
        .slice(2);

        const verifyResponse = await fetch("/api/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contractAddress: tokenAddress,
              contractName:
                tokenType === "simple"
                  ? "PisonSimpleToken"
                  : "PisonAdvancedToken",
              
              compilerVersion:
                "v0.8.20+commit.a1b79de6",
              constructorArguments,
            }),
          });

          const verifyData = await verifyResponse.json();

         
          if (verifyData.status === "1") {
              setVerificationGuid(verifyData.result);
              setVerificationStatus("Verification submitted. Checking status...");
            } else {
              setVerificationStatus(`Verification failed: ${verifyData.result}`);
            }
        alert("Token Created Successfully!");
        } catch (error) {
          console.error(error);
          alert("Token creation failed");
        } finally {
          setLoading(false);
        }
      }

      async function scanWallet() {
      try {
        if (!walletInput) {
          alert("Enter wallet address");
          return;
        }

        // SOLANA
        if (selectedNetwork === "solana") {
        const res = await fetch(
          "https://solana-rpc.publicnode.com",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "getBalance",
              params: [walletInput],
            }),
          }
        );

        const data = await res.json();

        if (data.error) {
          console.error(data.error);
          alert("Solana scan failed");
          return;
        }

       const solBalance =
          data.result.value / 1000000000;

        setWalletBalance(
          solBalance.toFixed(4)
        );

        // WALLET CLASSIFICATION
        if (solBalance >= 1000) {
        setWalletType("Mega Whale");
        setActivityScore("Smart Money");
        setWhaleAlert("🚨 Mega Whale Wallet Detected");
      } else if (solBalance >= 100) {
        setWalletType("Whale");
        setActivityScore("High Activity");
        setWhaleAlert("🐋 Whale Wallet Detected");
      } else if (solBalance >= 10) {
        setWalletType("Active Wallet");
        setActivityScore("Medium Activity");
        setWhaleAlert("");
      } else {
        setWalletType("Retail Wallet");
        setActivityScore("Low Activity");
        setWhaleAlert("");
      }

        setWalletNetwork("Solana");
        setNetworkSymbol("SOL");

        return;
      }

        // EVM RPCS
        let rpc = "";

        if (selectedNetwork === "bsc") {
          rpc = "https://bsc-dataseed.binance.org/";
          setNetworkSymbol("BNB");
        }

        if (selectedNetwork === "ethereum") {
          rpc = "https://ethereum-rpc.publicnode.com";
          setNetworkSymbol("ETH");
        }

        if (selectedNetwork === "base") {
          rpc = "https://base-rpc.publicnode.com";
          setNetworkSymbol("ETH");
        }

        if (selectedNetwork === "polygon") {
          rpc = "https://polygon-bor-rpc.publicnode.com";
          setNetworkSymbol("MATIC");
        }

        const provider =
          new ethers.JsonRpcProvider(rpc);

        const balance = await provider.getBalance(
          walletInput
        );

        const formattedBalance =
          Number(ethers.formatEther(balance));

        setWalletBalance(
          formattedBalance.toFixed(4)
        );

        setWalletNetwork(selectedNetwork);

        // WALLET CLASSIFICATION
           if (formattedBalance >= 1000) {
        setWalletType("Mega Whale");
        setActivityScore("Smart Money");
        setWhaleAlert(
          "🚨 Mega Whale Wallet Detected"
        );
      } else if (formattedBalance >= 100) {
        setWalletType("Whale");
        setActivityScore("High Activity");
        setWhaleAlert(
          "🐋 Whale Wallet Detected"
        );
      } else if (formattedBalance >= 10) {
        setWalletType("Active Wallet");
        setActivityScore("Medium Activity");
        setWhaleAlert("");
      } else {
        setWalletType("Retail Wallet");
        setActivityScore("Low Activity");
        setWhaleAlert("");
      }
      } catch (error) {
        console.error(error);
        alert("Wallet scan failed");
      }
    }


    async function checkVerificationStatus() {
        try {
          if (!verificationGuid) {
            alert("No verification GUID found yet.");
            return;
          }

          const response = await fetch("/api/verify-status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              guid: verificationGuid,
            }),
          });

          const data = await response.json();

         

          if (data.status === "1") {
            setVerificationStatus(data.result);
          } else {
            setVerificationStatus(data.result || "Verification still pending.");
          }
        } catch (error) {
          console.error(error);
          alert("Could not check verification status.");
        }
      }


          async function fetchWalletTransactions() {
            try {
              if (!walletInput) {
                alert("Enter wallet address first");
                return;
              }

              setLoadingTxs(true);

              const response = await fetch("/api/wallet-transactions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  walletAddress: walletInput,
                }),
              });

              const data = await response.json();

              

              if (data.status === "1") {
                setWalletTxs(data.result);
              } else {
                setWalletTxs([]);
                alert(data.result || "No transactions found");
              }
            } catch (error) {
              console.error(error);
              alert("Failed to fetch transactions");
            } finally {
              setLoadingTxs(false);
            }
          }

          async function fetchTokenAnalytics() {
            try {
              if (!createdToken) {
                alert("No token found");
                return;
              }

              setLoadingAnalytics(true);

              const response = await fetch(
                "/api/token-analytics",
                {
                  method: "POST",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify({
                    tokenAddress: createdToken,
                  }),
                }
              );

              const data = await response.json();

              console.log(
                "TOKEN ANALYTICS:",
                data
              );

              setTokenAnalytics(data);

            } catch (error) {
              console.error(error);

              alert(
                "Failed to fetch analytics"
              );
            } finally {
              setLoadingAnalytics(false);
            }
          }


  return (
    <main className="min-h-screen bg-[#020617] text-white p-8">
      <nav className="max-w-6xl mx-auto flex items-center justify-between mb-12">
        <div>
          <h1 className="text-2xl font-black">Pison</h1>
          <p className="text-xs text-gray-400">On-chain Intelligence DApp</p>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm text-gray-300">
          <a href="#home" className="hover:text-white">Home</a>
          <a href="#creator" className="hover:text-white">Token Creator</a>
          <a href="#intelligence" className="hover:text-white">Intelligence</a>
          <a href="#tokenomics" className="hover:text-white">Tokenomics</a>
          <a href="#roadmap" className="hover:text-white">Roadmap</a>
          <a href="#about" className="hover:text-white">About</a>
          <a href="#contact" className="hover:text-white">Contact</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://x.com/Pisondapp"
            target="_blank"
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm"
          >
            X
          </a>

          <a
            href="https://t.me/pisondapp"
            target="_blank"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-bold"
          >
            Telegram
          </a>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden bg-white/10 px-4 py-2 rounded-xl"
        >
          ☰
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden max-w-6xl mx-auto bg-white/10 border border-white/10 rounded-2xl p-5 mb-10 space-y-4">
          <a href="#home" className="block">Home</a>
          <a href="#creator" className="block">Token Creator</a>
          <a href="#intelligence" className="block">Intelligence</a>
          <a href="#tokenomics" className="block">Tokenomics</a>
          <a href="#roadmap" className="block">Roadmap</a>
          <a href="#about" className="block">About</a>
          <a href="#contact" className="block">Contact</a>

          <div className="flex gap-3 pt-3">
            <a
              href="https://x.com/Pisondapp"
              target="_blank"
              className="bg-white/10 px-4 py-2 rounded-xl text-sm"
            >
              X
            </a>

            <a
              href="https://t.me/pisondapp"
              target="_blank"
              className="bg-blue-600 px-4 py-2 rounded-xl text-sm font-bold"
            >
              Telegram
            </a>
          </div>
        </div>
      )}

      <div id="home" className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        
        <div className="relative">

          {/* Glow */}
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-500/20 blur-[120px] rounded-full"></div>

          {/* Badges */}
          <div className="flex flex-wrap gap-3 mb-6 relative z-10">
            <div className="bg-blue-500/20 border border-blue-500/30 px-4 py-2 rounded-full text-sm text-blue-300">
              Multi-Chain Intelligence
            </div>

            <div className="bg-purple-500/20 border border-purple-500/30 px-4 py-2 rounded-full text-sm text-purple-300">
              Smart Wallet Tracking
            </div>

            <div className="bg-green-500/20 border border-green-500/30 px-4 py-2 rounded-full text-sm text-green-300">
              Advanced Token Launcher
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 relative z-10">
            Pison
            <span className="block text-blue-400">
              On-Chain Intelligence
            </span>
          </h1>

          {/* Description */}
          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed relative z-10">
            Create advanced tokens, monitor whale wallets, scan multi-chain activity,
            and track smart money movement from one powerful Web3 dashboard.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 relative z-10">

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-2xl font-black text-blue-400">
                5+
              </p>
              <p className="text-gray-400 text-sm">
                Supported Chains
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-2xl font-black text-purple-400">
                Live
              </p>
              <p className="text-gray-400 text-sm">
                Wallet Intelligence
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-2xl font-black text-green-400">
                Smart
              </p>
              <p className="text-gray-400 text-sm">
                Whale Detection
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-2xl font-black text-yellow-400">
                V1
              </p>
              <p className="text-gray-400 text-sm">
                Public Launch
              </p>
            </div>

          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 relative z-10">

            <button
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-2xl font-bold text-lg"
            >
              {wallet
                ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
                : "Connect Wallet"}
            </button>

            <a
              href="https://x.com/Pisondapp"
              target="_blank"
              className="bg-white/10 hover:bg-white/20 px-8 py-4 rounded-2xl font-bold text-lg text-center"
            >
              Follow on X
            </a>

          </div>

        </div>

        <div
              id="creator"
              className="relative overflow-hidden bg-white/10 border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full"></div>
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full"></div>

              <div className="relative z-10"></div>
                      <div className="mb-6">
              <p className="text-sm text-purple-300 font-bold mb-2">
                TOKEN LAUNCHER
              </p>

              <h2 className="text-3xl font-black">
                Create Your Token
              </h2>

              <p className="text-gray-400 mt-2">
                Launch simple or advanced tokens directly from Pison.
              </p>
            </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setTokenType("simple")}
                  className={`rounded-xl py-3 font-bold border ${
                    tokenType === "simple"
                      ? "bg-blue-600 border-blue-500"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  Simple Token
                </button>

                <button
                  type="button"
                  onClick={() => setTokenType("advanced")}
                  className={`rounded-xl py-3 font-bold border ${
                    tokenType === "advanced"
                      ? "bg-purple-600 border-purple-500"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  Advanced Token
                </button>
              </div>
          <div className="space-y-4">

           <div className="mb-6">
            <label className="block text-gray-400 mb-3">
              Launch Network
            </label>

            <select
              value={launchNetwork}
              onChange={(e) => setLaunchNetwork(e.target.value)}
              className="w-full bg-[#020617] border border-white/10 rounded-2xl px-4 py-4 outline-none focus:border-yellow-400"
            >
              <option value="bsc">
                BNB Chain — Live
              </option>

              <option disabled>
                Base — Coming Soon
              </option>

              <option disabled>
                Polygon — Coming Soon
              </option>
            </select>

            <p className="text-xs text-green-400 mt-2">
              BNB Chain token creation is currently live. Base and Polygon support are coming soon.
            </p>
          </div>


            <input
              className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 outline-none"
              placeholder="Token Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 outline-none"
              placeholder="Symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            />

            <input
              className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 outline-none"
              placeholder="Supply"
              value={supply}
              onChange={(e) => setSupply(e.target.value)}
            />
              {tokenType === "advanced" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                  <h3 className="font-bold text-lg">
                    Advanced Features
                  </h3>

                  <input
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 outline-none"
                    placeholder="Buy Tax %"
                    value={buyTax}
                    onChange={(e) => setBuyTax(e.target.value)}
                  />

                  <input
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 outline-none"
                    placeholder="Sell Tax %"
                    value={sellTax}
                    onChange={(e) => setSellTax(e.target.value)}
                  />

                  <label className="flex items-center gap-3 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={burnEnabled}
                      onChange={(e) => setBurnEnabled(e.target.checked)}
                    />
                    Enable Burn
                  </label>
                  <label className="flex items-center gap-3 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={antiWhaleEnabled}
                          onChange={(e) => setAntiWhaleEnabled(e.target.checked)}
                        />
                        Enable Anti-Whale Protection
                      </label>

                      {antiWhaleEnabled && (
                        <div className="space-y-4">
                          <input
                            className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 outline-none"
                            placeholder="Max Wallet %"
                            value={maxWalletPercent}
                            onChange={(e) => setMaxWalletPercent(e.target.value)}
                          />

                          <input
                            className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 outline-none"
                            placeholder="Max Transaction %"
                            value={maxTxPercent}
                            onChange={(e) => setMaxTxPercent(e.target.value)}
                          />
                        </div>
                      )}
                </div>
              )}
            <button
              onClick={createToken}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl py-3 font-bold"
            >
              {loading
                ? "Creating Token..."
                : tokenType === "simple"
                ? "Launch Simple Token — 0.015 BNB"
                : "Launch Advanced Token — 0.05 BNB"}
            </button>
            {createdToken && (
              <div className="mt-6 bg-[#020617] border border-green-500/30 rounded-2xl p-4">
                <p className="text-green-400 font-bold mb-2">
                  Token Created Successfully
                </p>

                <p className="text-sm text-gray-400 break-all mb-4">
                  {createdToken}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdToken);
                      alert("Address copied!");
                    }}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm"
                  >
                    Copy
                  </button>

                  <a
                    href={`https://bscscan.com/address/${createdToken}`}
                    target="_blank"
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm"
                  >
                    Explorer
                  </a>
                </div>

                <div className="mt-4 border-t border-white/10 pt-4">
                    <p className="text-sm text-gray-400 mb-2">
                      Verification Status:
                    </p>

                    <p className="text-sm font-bold text-green-400 mb-3">
                      {verificationStatus || "Not submitted yet"}
                    </p>

                    <button
                      onClick={checkVerificationStatus}
                      className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl text-sm"
                    >
                      Check Verification Status
                    </button>

                     <button
                onClick={fetchTokenAnalytics}
                disabled={loadingAnalytics}
                className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-xl text-sm mt-4"
              >
                {loadingAnalytics
                  ? "Loading Analytics..."
                  : "Load Token Analytics"}
              </button>
                  </div>
              </div>
            )}

           


          {tokenAnalytics && (
            <div className="mt-6 bg-[#020617] border border-white/10 rounded-2xl p-6">

              <h2 className="text-2xl font-bold mb-6">
                Token Analytics
              </h2>

              <div className="grid md:grid-cols-2 gap-6">

                <div className="bg-black/30 rounded-2xl p-4">
                  <p className="text-gray-400 mb-2">
                    Holders
                  </p>

                  <p className="text-3xl font-bold text-cyan-400">
                    {
                      tokenAnalytics?.holders?.status === "1"
                      ? tokenAnalytics.holders.result
                      : "Pro API Required"
                    }
                  </p>
                </div>

                <div className="bg-black/30 rounded-2xl p-4">
                  <p className="text-gray-400 mb-2">
                    Recent Transfers
                  </p>

                  <p className="text-3xl font-bold text-green-400">
                    {
                      tokenAnalytics?.transfers?.result
                        ?.length || 0
                    }
                  </p>
                </div>

              </div>

              <div className="mt-8">

                <h3 className="text-xl font-bold mb-4">
                  Latest Transfers
                </h3>

                <div className="space-y-4">

                  {tokenAnalytics?.transfers?.result
                    ?.slice(0, 5)
                    ?.map((tx: any, index: number) => (

                      <div
                        key={index}
                        className="border border-white/10 rounded-xl p-4"
                      >

                        <p className="text-xs break-all mb-2">
                          TX:
                          {tx.hash}
                        </p>

                        <p className="text-xs break-all">
                          From:
                          {tx.from}
                        </p>

                        <p className="text-xs break-all">
                          To:
                          {tx.to}
                        </p>

                        <p className="text-green-400 font-bold mt-2">
                          Value:
                          {Number(tx.value) / 1e18}
                        </p>

                      </div>
                    ))}

                </div>

              </div>

            </div>
          )}

          </div>
        </div>
      <div className="mt-10 bg-white/10 border border-white/10 rounded-3xl p-8 shadow-2xl">
      <h2 className="text-3xl font-bold mb-6">
        Your Created Tokens
      </h2>

      {savedTokens.length === 0 ? (
        <p className="text-gray-400">
          No tokens created yet.
        </p>
      ) : (
        <div className="space-y-4">
          {savedTokens.map((token, index) => (
            <div
              key={index}
              className="bg-[#020617] border border-white/10 rounded-2xl p-4"
            >
              <p className="text-lg font-bold mb-1">
                {token.name}
              </p>

              <p className="text-sm text-gray-400 break-all mb-4">
                {token.address}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      token.address
                    );

                    alert("Copied!");
                  }}
                  className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm"
                >
                  Copy
                </button>

                <a
                  href={`https://bscscan.com/address/${token.address}`}
                  target="_blank"
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm"
                >
                  Explorer
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    <div className="mt-10">
          <button
            onClick={() =>
              setShowManageToken(!showManageToken)
            }
            className="w-full bg-purple-600 hover:bg-purple-700 rounded-2xl py-4 font-bold text-lg"
          >
            {showManageToken
              ? "Hide Manage Token"
              : "Manage Advanced Token"}
          </button>
          {showManageToken && (
        <div className="mt-6 bg-white/10 border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold mb-6">
            Manage Existing Token
          </h2>

          <div className="space-y-4">
            <input
              className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 outline-none"
              placeholder="Advanced Token Address"
              value={managedToken}
              onChange={(e) =>
                setManagedToken(e.target.value)
              }
            />

            <input
              className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 outline-none"
              placeholder="Liquidity Pair Address"
              value={pairAddress}
              onChange={(e) =>
                setPairAddress(e.target.value)
              }
            />

            <button
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-bold"
            >
              Set Liquidity Pair
            </button>
          </div>
        </div>
      )}
        </div>

        <div id="intelligence" className="mt-10 bg-white/10 border border-white/10 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-3xl font-bold mb-6">
          Wallet Intelligence
        </h2>

        <div className="space-y-4">

          <select
            value={selectedNetwork}
            onChange={(e) =>
              setSelectedNetwork(e.target.value)
            }
            className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 outline-none"
          >
            <option value="bsc">BNB Chain</option>
            <option value="ethereum">Ethereum</option>
            <option value="base">Base</option>
            <option value="polygon">Polygon</option>
            <option value="solana">Solana</option>
          </select>
          <input
            className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 outline-none"
            placeholder="Enter wallet address"
            value={walletInput}
            onChange={(e) =>
              setWalletInput(e.target.value)
            }
          />

          <button
            onClick={scanWallet}
            className="w-full bg-green-600 hover:bg-green-700 rounded-xl py-3 font-bold"
          >
            Scan Wallet
          </button>

          <button
            onClick={fetchWalletTransactions}
            disabled={loadingTxs}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-xl py-3 font-bold"
          >
            {loadingTxs ? "Loading Transactions..." : "Show Recent Transactions"}
          </button>

          {walletBalance && (
            <div className="bg-[#020617] border border-white/10 rounded-2xl p-4 mt-4">
              {whaleAlert && (
                <div className="bg-yellow-500/20 border border-yellow-500 rounded-2xl p-4 mb-4">
                  <p className="text-yellow-300 font-bold text-lg">
                    {whaleAlert}
                  </p>
                </div>
              )}
              <p className="text-gray-400 mb-2">
                Network:
              </p>

              <p className="font-bold mb-4">
                {walletNetwork}
              </p>

              <p className="text-gray-400 mb-2">
                Balance:
              </p>

              <p className="font-bold text-green-400">
                {walletBalance} {networkSymbol}
              </p>
              <p className="text-gray-400 mt-4 mb-2">
                Wallet Type:
              </p>

              <p className="font-bold text-purple-400">
                {walletType}
              </p>
              <p className="text-gray-400 mt-4 mb-2">
                Activity Score:
              </p>

              <p className="font-bold text-cyan-400">
                {activityScore}
              </p>
            </div>
          )}

          {walletTxs.length > 0 && (
          <div className="mt-6 bg-[#020617] border border-white/10 rounded-2xl p-4">
            <h3 className="text-xl font-bold mb-4">
              Recent BNB Chain Transactions
            </h3>

            <div className="space-y-4">
              {walletTxs.map((tx, index) => (
                <div
                  key={index}
                  className="border border-white/10 rounded-xl p-4"
                >
                  <p className="text-sm text-gray-400 mb-1">
                    Hash:
                  </p>

                  <p className="text-xs break-all mb-3">
                    {tx.hash}
                  </p>

                  <p className="text-sm text-gray-400">
                    From:
                  </p>

                  <p className="text-xs break-all mb-2">
                    {tx.from}
                  </p>

                  <p className="text-sm text-gray-400">
                    To:
                  </p>

                  <p className="text-xs break-all mb-2">
                    {tx.to}
                  </p>

                  <p className="text-sm text-green-400 font-bold">
                    Value: {Number(tx.value) / 1e18} BNB
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
      </div>
      <section className="max-w-6xl mx-auto mt-24">
            <div className="text-center mb-14">
              <p className="text-blue-400 font-bold mb-3">
                CORE FEATURES
              </p>

              <h2 className="text-4xl md:text-5xl font-black mb-4">
                Built for Modern Web3 Intelligence
              </h2>

              <p className="text-gray-400 max-w-3xl mx-auto text-lg">
                Pison combines token creation, wallet intelligence,
                whale tracking, and multi-chain analytics into one
                powerful decentralized platform.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition">
                <div className="text-4xl mb-4">🚀</div>

                <h3 className="text-xl font-black mb-3">
                  Token Launcher
                </h3>

                <p className="text-gray-400 leading-relaxed">
                  Create simple and advanced tokens with burn,
                  tax, and anti-whale protection directly from
                  the Pison dashboard.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition">
                <div className="text-4xl mb-4">🧠</div>

                <h3 className="text-xl font-black mb-3">
                  Wallet Intelligence
                </h3>

                <p className="text-gray-400 leading-relaxed">
                  Scan wallets across multiple chains and analyze
                  wallet balances, activity levels, and smart money behavior.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition">
                <div className="text-4xl mb-4">🐋</div>

                <h3 className="text-xl font-black mb-3">
                  Whale Detection
                </h3>

                <p className="text-gray-400 leading-relaxed">
                  Detect whale wallets, monitor high-value addresses,
                  and identify strong on-chain activity in real time.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition">
                <div className="text-4xl mb-4">🌐</div>

                <h3 className="text-xl font-black mb-3">
                  Multi-Chain Support
                </h3>

                <p className="text-gray-400 leading-relaxed">
                  Built for BNB Chain, Ethereum, Base, Polygon,
                  and Solana from a single unified interface.
                </p>
              </div>

            </div>
          </section>

      <section id="tokenomics" className="max-w-6xl mx-auto mt-20 px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-4">
            Pison Tokenomics
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Pison is designed to support token creation, smart wallet intelligence,
            whale tracking, and premium on-chain analytics.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            ["Ecosystem & Rewards", "35%"],
            ["Liquidity & Listings", "25%"],
            ["Treasury", "15%"],
            ["Team", "10%"],
            ["Marketing & Growth", "10%"],
            ["Advisors & Partners", "5%"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="bg-white/10 border border-white/10 rounded-3xl p-6"
            >
              <p className="text-3xl font-black text-blue-400 mb-2">
                {value}
              </p>
              <p className="text-gray-300">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="roadmap" className="max-w-6xl mx-auto mt-20 px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-4">
            Roadmap
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Pison is being built in stages, starting with token creation and expanding
            into a full on-chain intelligence terminal.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            ["Phase 1", "Token Creator + Wallet Intelligence"],
            ["Phase 2", "Whale Tracking + Smart Alerts"],
            ["Phase 3", "Auto Verification + Multi-chain Deployment"],
            ["Phase 4", "AI Signal Engine + Premium Dashboard"],
          ].map(([phase, text]) => (
            <div
              key={phase}
              className="bg-white/10 border border-white/10 rounded-3xl p-6"
            >
              <p className="text-purple-400 font-bold mb-2">{phase}</p>
              <p className="text-gray-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="max-w-6xl mx-auto mt-20 px-8">
  <div className="bg-white/10 border border-white/10 rounded-3xl p-10">
    <h2 className="text-4xl font-black mb-4">
      About Pison
    </h2>

    <p className="text-gray-300 text-lg leading-relaxed">
      Pison is a Web3 intelligence DApp built to help users create tokens,
      manage advanced token features, scan wallets across multiple chains,
      detect whale activity, and understand on-chain movement from one simple
      dashboard.
    </p>

    <p className="text-gray-400 mt-4 leading-relaxed">
      The mission is to make token creation and blockchain intelligence easier
      for builders, traders, communities, and early-stage crypto projects.
    </p>
  </div>
</section>

      <section id="contact" className="max-w-6xl mx-auto mt-20 px-8">
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-white/10 rounded-3xl p-10 text-center">
          <h2 className="text-4xl font-black mb-4">
            Join the Pison Community
          </h2>

          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Follow Pison for updates, launch announcements, product releases,
            and community discussions.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://x.com/Pisondapp"
              target="_blank"
              className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-2xl font-bold"
            >
              Follow on X
            </a>

            <a
              href="https://t.me/pisondapp"
              target="_blank"
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-2xl font-bold"
            >
              Join Telegram
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto mt-20 mb-20 px-8">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10 rounded-3xl p-10 text-center">
          <h2 className="text-4xl font-black mb-4">
            Whitepaper
          </h2>

          <p className="text-gray-300 max-w-3xl mx-auto mb-8">
            The Pison whitepaper will explain the platform vision, token utility,
            smart intelligence layer, revenue model, roadmap, and ecosystem growth
            strategy.
          </p>

          <button className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-2xl font-bold">
            Whitepaper Coming Soon
          </button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto mt-16 px-8">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-3xl p-6">
          <h3 className="text-yellow-300 font-bold mb-2">
            Disclaimer
          </h3>

          <p className="text-gray-400 text-sm leading-relaxed">
            Pison provides token creation tools and on-chain intelligence features for
            informational and utility purposes only. Pison does not provide financial
            advice, investment advice, or trading guarantees. Users are responsible
            for verifying smart contracts, understanding blockchain risks, and
            complying with applicable regulations before launching or interacting with
            any token.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10 py-10 px-8">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-black text-white">
                Pison
              </h3>
              <p className="text-gray-500 text-sm">
                Token creation and on-chain intelligence for Web3 builders.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
              <a href="#creator" className="hover:text-white">
                Token Creator
              </a>
              <a href="#intelligence" className="hover:text-white">
                Intelligence
              </a>
              <a href="#tokenomics" className="hover:text-white">
                Tokenomics
              </a>
              <a href="#roadmap" className="hover:text-white">
                Roadmap
              </a>
              <a
                href="https://x.com/Pisondapp"
                target="_blank"
                className="hover:text-white"
              >
                X
              </a>
              <a
                href="https://t.me/pisondapp"
                target="_blank"
                className="hover:text-white"
              >
                Telegram
              </a>
            </div>
          </div>

          <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/10 text-center text-xs text-gray-600">
            <p>
              © 2026 Pison DApp. All rights reserved.
            </p>
          </div>
        </footer>
    </main>
  );
}