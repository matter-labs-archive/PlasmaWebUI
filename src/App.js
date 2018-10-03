import React, { Component } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSignInAlt, faSignOutAlt, faSortAmountDown, faSitemap, faArrowRight, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import { faEthereum } from '@fortawesome/free-brands-svg-icons'
import { Container, Nav, Alert, Button, Col, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap';
import Web3 from 'web3';
import { BN } from 'bn.js';
import Transactions from './Transactions';
import History from './History';
import logo from './logo.svg';
import './App.css';

library.add(faEthereum, faSignInAlt, faSignOutAlt, faSortAmountDown, faSitemap, faArrowRight, faExternalLinkAlt)

class App extends Component {
  constructor(props) {
    super(props);

    if (!window.web3) {
      this.state = {
        account: '',
        ethBalance: '0',
        plasmaBalance: '0',
        metamaskWarningOpen: true,
        depositModalOpen: false,
      };

      return;
    }

    this.state = {
      account: '',
      ethBalance: '0',
      plasmaBalance: '0',
      metamaskWarningOpen: false,
      depositModalOpen: false,
      depositAmount: '',
      web3js: new Web3(window.web3.currentProvider),
    };

    this.onDismissMetamaskInfo = this.onDismissMetamaskInfo.bind(this);
    this.onPlasmaBalanceChanged = this.onPlasmaBalanceChanged.bind(this);
    this.toggleDepositModal = this.toggleDepositModal.bind(this);
    this.handleAmountChange = this.handleAmountChange.bind(this);
    this.onDepositSubmit = this.onDepositSubmit.bind(this);

    this.state.web3js.eth.net.getNetworkType().then((networkName) => {
      if (networkName !== 'rinkeby') {
        this.setState({ metamaskWarningOpen: true });
      } else {
        window.web3.currentProvider.publicConfigStore.on('update', () => {
          this.setMetaMaskAccount();
        });
        this.setMetaMaskAccount();
      }
    });

    let contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
    let contractAbi = JSON.parse(process.env.REACT_APP_CONTRACT_ABI);

    this.state.contract = new this.state.web3js.eth.Contract(contractAbi, contractAddress, { gas: 500000 });
  }

  formatPrice(weiPriceString) {
    if (this.state.web3js) {
      return parseFloat(this.state.web3js.utils.fromWei(weiPriceString)).toFixed(3);
    } else {
      return '0';
    }
  }

  setMetaMaskAccount() {
    let self = this;

    this.state.web3js.eth.getAccounts().then((accounts) => {
      if (accounts.length === 0) {
        this.setState({ metamaskWarningOpen: true });
        return;
      }

      let account = accounts[0];

      if (account && this.state.account !== account) {
        let contract = this.state.contract;
        contract.options.from = account;
        this.state.web3js.eth.getBalance(account, function (error, balance) {
          if (!error) {
            self.setState({ account: accounts[0], contract: contract, ethBalance: balance });
          }
        });
      }
    });
  }

  toggleDepositModal() {
    this.setState({ depositModalOpen: !this.state.depositModalOpen });
  }

  handleAmountChange(event) {
    this.setState({ depositAmount: event.target.value});
  }

  onDepositSubmit(event) {
    event.preventDefault();

    let self = this;
    let amount = parseFloat(this.state.depositAmount);

    if (amount > 0) {
      let weiAmount = this.state.web3js.utils.toWei((Math.floor(amount * 1000)).toString(), 'finney');
      
      console.log('Depositing...');

      this.state.contract.methods.deposit().send({ value: weiAmount }).on('transactionHash', function (hash){
        self.setState({ depositModalOpen: false });
        console.log(`https://rinkeby.etherscan.io/tx/${hash}`);
      });
    }
  }

  onDismissMetamaskInfo() {
    this.setState({ metamaskWarningOpen: false });
  }

  onPlasmaBalanceChanged(plasmaBalance) {
    this.setState({ plasmaBalance: plasmaBalance });
  }

  render() {
    return (
      <div className="App">
        <div className="d-flex flex-column flex-md-row align-items-center p-3 px-md-4 mb-3 bg-dark border-bottom shadow">
          <h5 className="my-0 mr-md-auto font-weight-normal"><a href="/"><img src={logo} className="logo" alt="logo" /></a></h5>
          <Nav className="ml-md-3">
            <span className="p-2 mr-3 text-light d-none d-md-inline-block text-truncate">Address: <strong>{this.state.account}</strong></span>
            <span className="p-2 mr-3 text-light">ETH Balance: <strong>{this.formatPrice(this.state.ethBalance)}</strong> <FontAwesomeIcon icon={["fab", "ethereum"]} /></span>
            <span className="p-2 mr-4 text-light">Plasma Balance: <strong>{this.formatPrice(this.state.plasmaBalance)}</strong> <FontAwesomeIcon icon={["fab", "ethereum"]} /></span>
          </Nav>
          <Button color="primary" onClick={this.toggleDepositModal}><FontAwesomeIcon icon="sign-in-alt" /> Deposit in <FontAwesomeIcon icon={["fab", "ethereum"]} /></Button>
        </div>
        <Container>
          <Modal isOpen={this.state.depositModalOpen} toggle={this.toggleDepositModal}>
            <Form onSubmit={this.onDepositSubmit}>
              <ModalHeader toggle={this.toggleDepositModal}>Deposit</ModalHeader>
              <ModalBody>
                <FormGroup row>
                  <Label for="amount" sm={2}>Amount</Label>
                  <Col sm={10}>
                    <Input type="text" name="amount" id="amount" placeholder="0.0" value={this.state.depositAmount} onChange={this.handleAmountChange} />
                  </Col>
                </FormGroup>
              </ModalBody>
              <ModalFooter>
                <Button color="success" type="submit" className="mr-2"><FontAwesomeIcon icon="arrow-right" /> <span className="d-none d-sm-inline">Transfer</span></Button>
                <Button color="secondary" onClick={this.toggleDepositModal}>Cancel</Button>
              </ModalFooter>
            </Form>
          </Modal>
          <Alert color="info" isOpen={this.state.metamaskWarningOpen} toggle={this.onDismissMetamaskInfo}>
            Please unlock MetaMask account and select Rinkeby test network
          </Alert>
          <Transactions web3js={this.state.web3js} account={this.state.account} onBalanceChanged={this.onPlasmaBalanceChanged} />
          <History />
          <footer className="pt-4 my-md-5 pt-md-5 border-top mx-3">
            <div className="row">
              <div className="col-12 col-md">
                <img className="mb-2 bg-dark logo-icon" src={logo} alt="" />
                <small className="d-block mb-3 text-muted">&copy;&nbsp;2018</small>
              </div>
              <div className="col-6 col-md">
                <h5>Features</h5>
                <ul className="list-unstyled text-small">
                  <li><a className="text-muted" href="https://thematter.io" target="_blank">Matter Plasma</a></li>
                </ul>
              </div>
              <div className="col-6 col-md">
                <h5>Resources</h5>
                <ul className="list-unstyled text-small">
                  <li><a className="text-muted" href="https://github.com/matterinc/" target="_blank">GitHub</a></li>
                </ul>
              </div>
              <div className="col-6 col-md">
                <h5>About</h5>
                <ul className="list-unstyled text-small">
                  <li><a className="text-muted" href="https://thematter.io/#rec66652294" target="_blank">Team</a></li>
                </ul>
              </div>
            </div>
          </footer>
        </Container>
      </div>
    );
  }
}

export default App;
