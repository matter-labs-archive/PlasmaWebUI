import React, { Component } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSignInAlt, faSignOutAlt, faSortAmountDown, faSitemap, faArrowRight, faExternalLinkAlt, faClock } from '@fortawesome/free-solid-svg-icons'
import { faEthereum } from '@fortawesome/free-brands-svg-icons'
import { Container, Nav, Alert, Button, Col, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap';
import Web3 from 'web3';
import { BN } from 'bn.js';
import Transactions from './Transactions';
import History from './History';
import logo from './logo.svg';
import './App.css';

library.add(faEthereum, faSignInAlt, faSignOutAlt, faSortAmountDown, faSitemap, faArrowRight, faExternalLinkAlt, faClock);

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
      web3js: new Web3(window.ethereum || window.web3.currentProvider),
    };

    this.onDismissMetamaskInfo = this.onDismissMetamaskInfo.bind(this);
    this.onPlasmaBalanceChanged = this.onPlasmaBalanceChanged.bind(this);
    this.toggleDepositModal = this.toggleDepositModal.bind(this);
    this.handleAmountChange = this.handleAmountChange.bind(this);
    this.onDepositSubmit = this.onDepositSubmit.bind(this);

    if (window.web3 && window.web3.currentProvider && !window.web3.currentProvider.isTrust) {
      this.state.web3js.eth.net.getNetworkType().then((networkName) => {
        if (networkName !== process.env.REACT_APP_NETWORK_NAME.toLowerCase()) {
          this.setState({ metamaskWarningOpen: true });
        } else {
          if (window.ethereum && window.ethereum.publicConfigStore) {
            window.ethereum.publicConfigStore.on('update', () => {
              this.setMetaMaskAccount();
            });
            this.setMetaMaskAccount();
          }
        }
      });
    }

    const plasmaContractAddress = process.env.REACT_APP_PLASMA_CONTRACT_ADDRESS;
    const plasmaContractAbi = JSON.parse(process.env.REACT_APP_PLASMA_CONTRACT_ABI);
    this.state.plasmaContract = new this.state.web3js.eth.Contract(plasmaContractAbi, plasmaContractAddress, { gas: 1000000 });
    
    // var event = this.state.plasmaContract.DepositEvent({fromBlock: 0});
    // event.watch(function (error, result) {
    //  if (!error)
    //    console.log(result);
    // });
    
    this.setPriorityQueueContract();
  }

  formatPrice(weiPriceString) {
    if (this.state.web3js) {
      return parseFloat(this.state.web3js.utils.fromWei(weiPriceString)).toFixed(3);
    } else {
      return '0';
    }
  }

  async setPriorityQueueContract() {
    const priorityQueueContractAddress = await this.state.plasmaContract.methods.exitQueue().call();
    const priorityQueueContractAbi = JSON.parse(process.env.REACT_APP_PRIORITY_QUEUE_CONTRACT_ABI);
    const priorityQueueContract = new this.state.web3js.eth.Contract(priorityQueueContractAbi, priorityQueueContractAddress, { gas: 1000000 });
    const plasmaBlockNumber = await this.state.plasmaContract.methods.lastBlockNumber().call();

    this.setState({ priorityQueueContract: priorityQueueContract, plasmaBlockNumber: plasmaBlockNumber.toString() });
  }

  async setMetaMaskAccount() {
    let self = this;

    let accounts = await this.state.web3js.eth.getAccounts();
    if (accounts.length === 0) {
      this.setState({ account: null, metamaskWarningOpen: true });
      return;
    }

    let account = accounts[0];

    if (account && this.state.account !== account) {
      let contract = this.state.plasmaContract;
      contract.options.from = account;

      let balance = await this.state.web3js.eth.getBalance(account);
      self.setState({ account: accounts[0], contract: contract, ethBalance: balance, metamaskWarningOpen: false });
    }
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

      this.state.plasmaContract.methods.deposit().send({ value: weiAmount })
      .on('transactionHash', function (hash) {
        self.setState({ depositModalOpen: false });
        console.log(`https://rinkeby.etherscan.io/tx/${hash}`);
      });

      // .on('transactionHash', function (hash) {
      //   self.setState({ depositModalOpen: false });
      //   console.log(`https://rinkeby.etherscan.io/tx/${hash}`);
      // }).on('receipt', function (receipt) {
      //   console.log('1');
      //   console.log('receipt:', receipt);
      // }).on('confirmation', function (confirmationNumber, receipt) {
      //   console.log('2');
      //   console.log('confirmation:', confirmationNumber, receipt);
      // }).on('error', function (err) {
      //   console.error(err);
      // });
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
            <span className="p-2 mr-4 text-light d-none d-xl-inline-block" title="Current Plasma Block">Block: <strong>{this.state.plasmaBlockNumber}</strong></span>
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
            Please unlock MetaMask account and select {process.env.REACT_APP_NETWORK_NAME} network
          </Alert>
          <Transactions web3js={this.state.web3js} plasmaContract={this.state.plasmaContract} account={this.state.account} onBalanceChanged={this.onPlasmaBalanceChanged} />
          <History web3js={this.state.web3js} plasmaContract={this.state.plasmaContract} priorityQueueContract={this.state.priorityQueueContract} account={this.state.account} />
          <footer className="pt-4 my-md-5 pt-md-5 border-top mx-3">
            <div className="row">
              <div className="col-12 col-md">
                <img className="mb-2 bg-dark logo-icon" src={logo} alt="" />
                <small className="d-block mb-3 text-muted">&copy;&nbsp;Matter&nbsp;Inc.&nbsp;2018</small>
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
