# ProofRank Wallet

ProofRank Wallet is a full-stack decentralized credential portfolio for receivers, professionals, colleges, certificate providers, and issuers. It combines:

- React + Tailwind frontend
- Node.js + Express + MongoDB backend
- Solidity smart contract for certificate issuance
- Pinata IPFS integration for certificate PDFs
- MetaMask wallet authentication using signed messages
- Role-based entry for issuers and receivers
- Public/private credential visibility controls
- Issuer review flow for self-added credential verification
- A ranking algorithm that prioritizes credibility, verification, recency, achievement level, and relevance

## Folder Structure

```text
.
|-- backend
|   |-- src
|   |   |-- app.js
|   |   |-- server.js
|   |   |-- config
|   |   |-- controllers
|   |   |-- middleware
|   |   |-- models
|   |   |-- routes
|   |   |-- services
|   |   `-- utils
|   |-- .env.example
|   `-- package.json
|-- contracts
|   |-- contracts
|   |   `-- Certificate.sol
|   |-- scripts
|   |   |-- addIssuer.js
|   |   `-- deploy.js
|   |-- .env.example
|   |-- hardhat.config.js
|   `-- package.json
|-- frontend
|   |-- src
|   |   |-- components
|   |   |-- context
|   |   |-- hooks
|   |   |-- lib
|   |   |-- pages
|   |   `-- utils
|   |-- .env.example
|   |-- index.html
|   |-- tailwind.config.js
|   |-- vite.config.js
|   `-- package.json
|-- .gitignore
|-- package.json
`-- README.md
```

## Features

### Receiver side

- Connect MetaMask and authenticate with a signed message
- View connected wallet address
- Fetch issued credentials tied to the receiver wallet
- Add self-reported achievements through the backend API
- Toggle credentials between public and private visibility
- Send self-added credentials to an issuer wallet for verification
- Separate dashboard tabs for verified, self-added, and pending items
- Rank public profile credentials with the ProofRank scoring algorithm
- Share a public profile at `/u/:address` via copy, native share, email, WhatsApp, and LinkedIn

### Issuer side

- Choose issuer role once and bind it to the connected wallet
- Save issuer organization name and type such as college or certificate provider
- Sign the document hash with MetaMask before upload
- Upload certificate PDFs to Pinata IPFS
- Store returned CID on-chain with `issueCertificate`
- Mirror issued certificate records to MongoDB
- Default issued credentials to private visibility for the receiver
- Review self-added verification requests from receivers
- Review issued certificate history from the issuer dashboard

## Ranking Algorithm

Each credential receives a score:

```text
score =
  issuerWeight +
  achievementLevel +
  verificationBonus +
  recencyBonus +
  relevanceScore
```

The frontend implementation lives in `frontend/src/utils/ranking.js`.

## Environment Variables

### Backend

Copy `backend/.env.example` to `backend/.env` and fill in:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_ORIGIN`
- `PINATA_JWT`
- `PINATA_GATEWAY`

### Frontend

Copy `frontend/.env.example` to `frontend/.env` and fill in:

- `VITE_API_BASE_URL`
- `VITE_CERTIFICATE_CONTRACT_ADDRESS`
- `VITE_READ_RPC_URL`
- `VITE_IPFS_GATEWAY`

### Contracts

Copy `contracts/.env.example` to `contracts/.env` and fill in:

- `SEPOLIA_RPC_URL` if deploying to Sepolia
- `PRIVATE_KEY`

## How To Run

### 1. Install dependencies

Run the following from the repository root:

```bash
npm install
```

### 2. Start MongoDB

Use a local MongoDB instance or a managed cluster and place the connection string in `backend/.env`.

### 3. Deploy the smart contract

Start a local Hardhat node in one terminal:

```bash
npx hardhat node
```

Then deploy from the `contracts` workspace:

```bash
npm --workspace contracts run deploy:local
```

Copy the deployed contract address into `frontend/.env` as `VITE_CERTIFICATE_CONTRACT_ADDRESS`.

### 4. Choose an app role

Issuer authorization is now app-profile based. Open the frontend, choose issuer or receiver on the start page, connect MetaMask, and the wallet will be bound to that role in MongoDB. Issuer wallets can issue certificates on-chain without a separate `addIssuer` transaction.

### 5. Start the backend API

```bash
npm --workspace backend run dev
```

Backend will be available at `http://localhost:5000`.

### 6. Start the frontend

```bash
npm --workspace frontend run dev
```

Frontend will be available at `http://localhost:5173`.

## API Endpoints

### Authentication

- `POST /api/auth/nonce`
- `POST /api/auth/verify`

### Achievements

- `POST /api/achievement/add`
- `GET /api/achievement/:address`
- `PATCH /api/achievement/:achievementId/visibility`
- `POST /api/achievement/:achievementId/request-verification`
- `GET /api/achievement/issuer/requests`
- `PATCH /api/achievement/:achievementId/verification-review`

### Issuer / IPFS

- `GET /api/issuer/:address`
- `GET /api/issuer/received/:address`
- `PATCH /api/issuer/received/:certificateId/visibility`
- `POST /api/issuer/record`
- `POST /api/ipfs/upload-certificate`

## Notes

- Self-added achievements are stored with `verified: false`.
- Issued credentials are signed before upload and mirrored with signature metadata in MongoDB.
- Issued credentials are private by default until the receiver makes them public.
- Public profile routes only show credentials marked public.
- On-chain certificates are treated as verified proofs in the UI.
- Any wallet can issue on-chain; the app experience is controlled by the wallet-bound issuer or receiver role.
- The frontend ABI is defined in `frontend/src/lib/certificateAbi.js`.
- Pinata uploads are handled on the backend so the JWT never needs to be exposed in the browser.
"# clg-project" 
