<h3 align="center">
  <a href="https://thematter.io/">
    <img src="https://scontent-arn2-1.xx.fbcdn.net/v/t1.0-9/42614873_308414336637874_8225471638720741376_n.png?_nc_cat=106&_nc_ht=scontent-arn2-1.xx&oh=36eec27649e6cb3079108415d8bb77b7&oe=5CB0FBF8" width="100" />
    <br />
    The Matter Plasma Implementation
  </a>
</h3>
<p align="center">
  <a href="https://github.com/matterinc/PlasmaContract">Contract</a> &bull;
  <a href="https://github.com/matterinc/plasma.js">TX & Block RLP</a> &bull;
  <a href="https://github.com/matterinc/PlasmaManager">JS Lib</a> &bull;
  <a href="https://github.com/matterinc/PlasmaSwiftLib">Swift Lib</a> &bull;
  <a href="https://github.com/matterinc/PlasmaWebExplorer">Block Explorer</a> &bull;
  <b>Web App</b> &bull;
  <a href="https://github.com/matterinc/DiveLane">iOS App</a>
</p>

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

## Credits

Denis Khoruzhiy, [@DirectX](https://github.com/DirectX)
