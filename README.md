# Plasma Web UI
This project contains React based web app that demonstrates basic interaction with matter plasma. 
To use that sample you must have metamask installed.

### To launch do the following:
- Clone repo with submodules `git clone https://github.com/matterinc/PlasmaWebUI.git`
- `npm i`
- Copy  `.env` file to untracked version `.env.local` and edit it:
```
REACT_APP_NETWORK_NAME="Main" # "Rinkeby"
REACT_APP_API_URL_PREFIX="http://<IP_ADDRESS>"
REACT_APP_BLOCK_STORAGE_PREFIX="http://<PATH>"
REACT_APP_PLASMA_CONTRACT_ADDRESS="<CONTRACT_ADDRESS>"
```

If you are not going to deploy your own SmartContract and Opearator Node you can use following parameters to connect this app to matter plasma deployment on the `rinkeby` testnet
```
REACT_APP_NETWORK_NAME="Rinkeby"
REACT_APP_API_URL_PREFIX="https://plasma-testnet.thematter.io/api/v1"
REACT_APP_BLOCK_STORAGE_PREFIX="https://plasma-testnet.ams3.digitaloceanspaces.com/plasma"
REACT_APP_PLASMA_CONTRACT_ADDRESS="0x1effBc5DBE9f0daAB73C08e3A00cf105B29C547B"
```

- `npm start`

Note: don't forget to unlock your metamask and chose appropriate network
