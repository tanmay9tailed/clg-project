export const CERTIFICATE_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "student", type: "address" },
      { indexed: false, internalType: "string", name: "certId", type: "string" },
      { indexed: false, internalType: "string", name: "cid", type: "string" },
      { indexed: true, internalType: "address", name: "issuer", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    name: "CertificateIssued",
    type: "event"
  },
  {
    inputs: [{ internalType: "address", name: "student", type: "address" }],
    name: "getCertificates",
    outputs: [
      {
        components: [
          { internalType: "string", name: "certId", type: "string" },
          { internalType: "string", name: "cid", type: "string" },
          { internalType: "address", name: "issuer", type: "address" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bool", name: "valid", type: "bool" }
        ],
        internalType: "struct Certificate.Cert[]",
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "student", type: "address" },
      { internalType: "string", name: "certId", type: "string" },
      { internalType: "string", name: "cid", type: "string" }
    ],
    name: "issueCertificate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];
