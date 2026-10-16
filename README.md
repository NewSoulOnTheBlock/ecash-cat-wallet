# eCash Cat Wallet

A Chrome extension wallet for **eCash (ECX)** that dapps reach through
[eCash Connect](https://github.com/NewSoulOnTheBlock/ecash-connect), an
eCash port of sats-connect. Sites ask; you approve each request in a window
that shows exactly what is signed or sent.

> **Status: early.** Tested end to end on a local eCash devnet (regtest +
> drivechain enforcer). Not audited. Use throwaway amounts. Mainnet and betanet
> work once you point the wallet at an ECX indexer in Settings.

## What it does

- Create or import a wallet (BIP39, 12 or 24 words). One native segwit
  (`p2wpkh`, BIP84) address per network; mainnet uses Bitcoin's coin type, so a
  Bitcoin seed finds its fork ECX.
- Answers eCash Connect requests: `wallet_connect`, `getAddresses`,
  `getBalance`, `signMessage` (BIP322, or ECDSA/BIP137), `signPsbt`,
  `sendTransfer`, `drivechain_getSidechains`, `drivechain_deposit`,
  `ecash_checkReplay`.
- **Replay guard.** ECX kept Bitcoin's signature hashing with no fork id, so a
  transaction signed for ECX is also valid on Bitcoin whenever every coin it
  spends still exists there. The wallet refuses to sign such a transaction and
  mixes in an ECX-only coin when it has one.
- **Drivechain deposits (BIP300 M5).** Builds the treasury and `OP_RETURN`
  outputs itself, checks the enforcer's treasury against the chain, and
  validates the sidechain address (slot and checksum) before anything is sent:
  a sidechain credits an unparseable address to the all-zero address.

## Install (no build)

1. Download `ecash-cat-wallet-<version>.zip` from
   [Releases](https://github.com/NewSoulOnTheBlock/ecash-cat-wallet/releases)
   and unzip it.
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load
   unpacked**, and pick the unzipped folder.
3. Click the cat in the toolbar and create a wallet.

Chrome 116 or newer.

## Networks

| Network | Address prefix | Default servers |
|---|---|---|
| Devnet (regtest) | `bcrt1q…` | indexer `http://127.0.0.1:3002`, enforcer `http://127.0.0.1:50051` |
| Betanet | `tb1q…` | none: set them in Settings |
| Mainnet | `bc1q…` | none: set them in Settings (replay checks use mempool.space) |

The indexer is any Esplora API for ECX (for example mempool/electrs). The
enforcer is a `bip300301_enforcer`, reached as Connect JSON over HTTP, and is
needed only for sidechain deposits.

## Security model

- The recovery phrase is encrypted with your password (PBKDF2-SHA256, 600k
  iterations, AES-256-GCM) in `chrome.storage.local`. While unlocked it sits in
  `chrome.storage.session`, which content scripts cannot read and the browser
  clears on exit. It auto-locks after 15 minutes idle.
- Web pages only see a provider object; requests go page → content script →
  service worker, and the site's origin comes from Chrome, not the page.
- Every signature and payment needs an approval in the wallet's own window.
  Connected sites are listed in the popup and can be disconnected.

## Build

```sh
bun install
bun run build        # dist/ is the unpacked extension
bun run zip          # dist/ as ecash-cat-wallet-<version>.zip
bun run typecheck
```

Icons: `python3 scripts/icons.py <square image>` writes `static/icons/`.

## Tests

Both need a local eCash devnet (ECX regtest, electrs, bip300301_enforcer) and
`test/devnet.sh`, which expects the devnet's `lib.sh` (`grpc`, `mine_l1`) at
`$DEVNET`. On Windows they run the devnet commands in WSL (`WSL_DISTRO`, default
`Debian`).

- `bun test/devnet.e2e.ts`: drives the wallet service like a dapp, 34 checks:
  connect, fund, BIP322/BIP137, send, a dapp-built PSBT, an M5 deposit the
  enforcer accepts as the new treasury, lock/unlock, disconnect.
- `bun test/ui.e2e.ts`: the real extension in Chromium (`CHROMIUM=…`).

## Store listing

`CHROMEWEBSTORE.md` holds the listing copy, a justification per permission and
the data-use disclosure for a future Chrome Web Store submission.

## License

MIT
