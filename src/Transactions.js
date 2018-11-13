import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Container, Row, Col, Button, ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap';
import { PlasmaTransaction, PlasmaTransactionWithSignature, TxTypeSplit, TxTypeMerge, TransactionInput, TransactionOutput, Block } from '@thematter_io/plasma.js';
import { BN } from 'bn.js';
import * as ethUtil from 'ethereumjs-util';
import './Transactions.css';

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

class Transactions extends Component {
  constructor(props) {
    super(props);

    this.state = {
      sortDropdownOpen: false,
      transferModalOpen: false,
      withdrawModalOpen: false,
      transferAddressTo: '',
      transferAmount: '',
      mergeUTXOs: [],
      utxos: [],
    };

    this.toggleSort = this.toggleSort.bind(this);
    this.toggleTransferModal = this.toggleTransferModal.bind(this);
    this.openTransferModal = this.openTransferModal.bind(this);
    this.handleAddressChange = this.handleAddressChange.bind(this);
    this.handleAmountChange = this.handleAmountChange.bind(this);
    this.onTransferSubmit = this.onTransferSubmit.bind(this);
    this.toggleWithdrawModal = this.toggleWithdrawModal.bind(this);
    this.openWithdrawModal = this.openWithdrawModal.bind(this);
    this.onWithdrawSubmit = this.onWithdrawSubmit.bind(this);

    var self = this;
    setInterval(() => { self.loadTransactions(self.props.account); }, 2000);
  }

  componentDidUpdate(prevProps) {
    if (this.props.account !== prevProps.account) {
      this.loadTransactions(this.props.account);
    }
  }

  formatPrice(weiPriceString) {
    let price = this.props.web3js.utils.fromWei(weiPriceString);
    if (price >= '0.0001') {
      return `${price} ETH`;
    } else {
      return `${weiPriceString} Wei`
    }
  }

  toggleSort() {
    this.setState({ sortDropdownOpen: !this.state.sortDropdownOpen });
  }

  toggleMerge(utxo) {
    if (this.state.mergeUTXO) {
      utxo = null;
    }

    let mergeUTXOs = [];

    if (utxo) {
      for (const u of this.state.utxos) {
        if (u !== utxo)
        mergeUTXOs.push(u);
      }
    }

    console.log(mergeUTXOs);

    this.setState({
      mergeUTXO: utxo,
      mergeUTXOs: mergeUTXOs,
    });
  }

  toggleTransferModal(utxo) {
    this.setState({ transferModalOpen: !this.state.transferModalOpen });
  }

  openTransferModal(utxo) {
    this.setState({
      transferModalOpen: true,
      transferUTXO: utxo,
      transferAddressTo: '',
      transferAmount: '',
    });
  }

  handleAddressChange(event) {
    this.setState({transferAddressTo: event.target.value});
  }

  handleAmountChange(event) {
    this.setState({transferAmount: event.target.value});
  }

  async onTransferSubmit(event) {
    event.preventDefault();

    const self = this;
    let amount = parseFloat(this.state.transferAmount);

    if (amount > 0) {
      let weiAmount = this.props.web3js.utils.toWei((Math.floor(amount * 1000000.0)).toString(), 'szabo');

      try {
        await this.transfer(this.state.transferUTXO, this.props.account, this.state.transferAddressTo, weiAmount);
        self.setState({ transferModalOpen: false });
        console.log('Success!');
        // await this.loadTransactions(this.props.account);
        // await sleep(5000);
        // await this.loadTransactions(this.props.account);
      } catch(err) {
        console.log('Error:', err);
      };
    }
  }

  toggleWithdrawModal(utxo) {
    this.setState({ withdrawModalOpen: !this.state.withdrawModalOpen });
  }

  openWithdrawModal(utxo) {
    this.setState({
      withdrawModalOpen: true,
      withdrawUTXO: utxo,
    });
  }

  async onWithdrawSubmit(event) {
    event.preventDefault();

    const self = this;
    const blockNumber = this.state.withdrawUTXO.blockNumber;
    const url = `${process.env.REACT_APP_BLOCK_STORAGE_PREFIX}/${blockNumber}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/octet-stream'
        },
        mode: 'cors',
      });

      const blockBlob = await response.blob();

      const reader = new FileReader();
      reader.addEventListener("loadend", async function () {
        const blockArrayBuffer = this.result;
        const blockBuffer = new Buffer(blockArrayBuffer);
        const block = new Block(blockBuffer);
        const proof = block.getProofForTransactionByNumber(self.state.withdrawUTXO.transactionNumber);
        const withdrawCollateral = await self.props.plasmaContract.methods.WithdrawCollateral().call();

        await self.props.plasmaContract.methods.startExit(self.state.withdrawUTXO.blockNumber, self.state.withdrawUTXO.outputNumber, ethUtil.bufferToHex(proof.tx.serialize()), ethUtil.bufferToHex(proof.proof)).send({ value: withdrawCollateral }).on('transactionHash', async function (hash) {
          self.setState({ withdrawModalOpen: false });
          console.log('Success!');
          // await sleep(2000);
          // await self.loadTransactions(self.props.account);
        });
      });
      reader.readAsArrayBuffer(blockBlob);
    } 
    catch (err) {  
      console.log('Request error:', err);
    }
  }

  async loadTransactions(address) {
    const self = this;
    let url = `${process.env.REACT_APP_API_URL_PREFIX}/listUTXOs`;

    let payload = {
      "for": `${address}`,
      "blockNumber": 1, 
      "transactionNumber": 0, 
      "outputNumber": 0,
      "limit": 50
    };
    
    try {
      let response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(payload)
      });

      if (response.status !== 200) {  
        throw 'Error loading transactions';  
      }

      try {
        let data = await response.json();

        if (data.utxos.length > 0 && data.utxos.length != self.state.utxos.length) {
          //console.log("->", data.utxos.length);
          self.setState({ utxos: data.utxos });
        }
        else {
          //console.log("skipping:", data.utxos.length);
        }

        let balance = new BN();

        data.utxos.map(function (utxo) {
          balance.iadd(new BN(utxo.value));
        });

        self.props.onBalanceChanged(balance.toString());
      } catch (err) {  
        console.log('JSON decode error:', err);
      }
    } 
    catch (err) {  
      console.log('Request error:', err);
    }
  }

  async transfer(utxo, addressFrom, addressTo, weiAmount) {
    const self = this;

    console.log('Transferring...');

    let allInputs = [];
    let allOutputs = [];

    const inp = new TransactionInput({
      blockNumber: (new BN(utxo.blockNumber)).toArrayLike(Buffer, 'be', 4),
      txNumberInBlock: (new BN(utxo.transactionNumber)).toArrayLike(Buffer, 'be', 4),
      outputNumberInTransaction: (new BN(utxo.outputNumber)).toArrayLike(Buffer, 'be', 1),
      amountBuffer: (new BN(utxo.value)).toArrayLike(Buffer, 'be', 32)
    });
    allInputs.push(inp);

    weiAmount = new BN(weiAmount);

    let zero = new BN();
    let changeWeiAmount = new BN(utxo.value);
    changeWeiAmount.isub(weiAmount);

    let outputs = [{ to: addressTo, amount: weiAmount.toString() }];

    if (changeWeiAmount.gt(zero)) {
      outputs.push({ to: addressFrom, amount: changeWeiAmount.toString() });
    }

    if (changeWeiAmount.lt(zero)) {
      throw 'Insufficient funds';
    }

    if (!ethUtil.isValidAddress(addressTo)) {
      throw 'Invalid address';
    }

    let outputCounter = 0;
    for (const output of outputs) {
      const out = new TransactionOutput({
        outputNumberInTransaction: (new BN(outputCounter)).toArrayLike(Buffer, 'be', 1),
        amountBuffer: (new BN(output.amount)).toArrayLike(Buffer, 'be', 32),
        to: ethUtil.toBuffer(output.to)
      });
      allOutputs.push(out);
      outputCounter++;
    }
    
    const plasmaTransaction = new PlasmaTransaction({
      transactionType: (new BN(TxTypeSplit)).toArrayLike(Buffer, 'be', 1),
      inputs: allInputs,
      outputs: allOutputs
    });

    const tx = new PlasmaTransactionWithSignature({
      transaction: plasmaTransaction
    });

    const serialized = tx.transaction.serialize();
    const txHex = ethUtil.bufferToHex(serialized);

    let sigRes = await self.props.web3js.eth.personal.sign(txHex, addressFrom);

    tx.serializeSignature(sigRes);
    const fullTX = ethUtil.bufferToHex(tx.serialize());

    let url = `${process.env.REACT_APP_API_URL_PREFIX}/sendRawTX`;
    
    let payload = {
      tx: fullTX,
    }

    try {
      let response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(payload)
      });

      if (response.status !== 200) {  
        throw 'Response status error';
      }

      response.json().then(async function (data) {
        if (data.error) {
          throw data.reason;
        } else {
          // await sleep(500);
          // await self.loadTransactions(self.props.account);
          // await sleep(60000);
          // await self.loadTransactions(self.props.account);
          return;
        }
      });
    } catch (err) {  
      throw err;
    };
  }

  async merge(utxos) {
    const self = this;

    console.log('Merging...');
    console.log(utxos);

    let allInputs = [];
    let allOutputs = [];

    const address = this.props.account;

    let weiAmount = new BN();
    for (const utxo of utxos) {
      weiAmount.iadd(new BN(utxo.value));
      const inp = new TransactionInput({
        blockNumber: (new BN(utxo.blockNumber)).toArrayLike(Buffer, 'be', 4),
        txNumberInBlock: (new BN(utxo.transactionNumber)).toArrayLike(Buffer, 'be', 4),
        outputNumberInTransaction: (new BN(utxo.outputNumber)).toArrayLike(Buffer, 'be', 1),
        amountBuffer: (new BN(utxo.value)).toArrayLike(Buffer, 'be', 32)
      });
      allInputs.push(inp);
    }

    const out = new TransactionOutput({
      outputNumberInTransaction: (new BN(0)).toArrayLike(Buffer, 'be', 1),
      amountBuffer: weiAmount.toArrayLike(Buffer, 'be', 32),
      to: ethUtil.toBuffer(address)
    });
    allOutputs.push(out);
    
    const plasmaTransaction = new PlasmaTransaction({
      transactionType: (new BN(TxTypeMerge)).toArrayLike(Buffer, 'be', 1),
      inputs: allInputs,
      outputs: allOutputs
    });

    const tx = new PlasmaTransactionWithSignature({
      transaction: plasmaTransaction
    });

    const serialized = tx.transaction.serialize();
    const txHex = ethUtil.bufferToHex(serialized);

    let sigRes = await self.props.web3js.eth.personal.sign(txHex, address);

    tx.serializeSignature(sigRes);
    const fullTX = ethUtil.bufferToHex(tx.serialize());

    let url = `${process.env.REACT_APP_API_URL_PREFIX}/sendRawTX`;
    
    let payload = {
      tx: fullTX,
    }

    try {
      let response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(payload)
      });

      if (response.status !== 200) {  
        throw 'Response status error';
      }

      response.json().then(async function (data) {
        if (data.error) {
          throw data.reason;
        } else {
          // await sleep(500);
          // await self.loadTransactions(self.props.account);
          // await sleep(60000);
          // await self.loadTransactions(self.props.account);
          return;
        }
      });
    } catch (err) {  
      throw err;
    };
  }

  render() {
    return (
      <div className="Transactions">
        <Row className="px-3">
          <Col>
            <h2>UTXOs</h2>
          </Col>
          <Col className="text-right">
            <ButtonDropdown isOpen={this.state.sortDropdownOpen} toggle={this.toggleSort}>
              <DropdownToggle caret>
                <FontAwesomeIcon icon="sort-amount-down" /> Sort By
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem>Block Number</DropdownItem>
              </DropdownMenu>
            </ButtonDropdown>
          </Col>
        </Row>
        <p hidden={this.state.utxos.length !== 0} className="lead mx-3 my-4 text-muted text-center">No Records</p>            
        {this.state.utxos.map(function (utxo) {
          return <Container className="tx p-3 shadow">
            <Row className="align-items-center">
              <Col className="text-nowrap"><Badge color="primary" className="mr-1" title="Block number"><span className="d-none d-sm-inline">B </span>{utxo.blockNumber}</Badge><Badge color="secondary" className="mr-1" title="Transaction number"><span className="d-none d-sm-inline">T </span>{utxo.transactionNumber}</Badge><Badge color="info" className="mr-3" title="Output number"><span className="d-none d-sm-inline">O </span>{utxo.outputNumber}</Badge></Col>
              <Col className="lead"><span className="font-weight-bold">{this.formatPrice(utxo.value)}</span></Col>
              <Col className="col-auto">
                <Button color="success" className="mr-2" onClick={() => this.openTransferModal(utxo)} title="Transfer"><FontAwesomeIcon icon="arrow-right" /> <span className="d-none d-sm-inline">Transfer</span></Button>          
                <ButtonDropdown isOpen={this.state.mergeUTXO === utxo} toggle={() => this.toggleMerge(utxo)} className="mr-2" title="Merge With...">
                  <DropdownToggle color="info" caret outline={this.state.utxos.length === 1} disabled={this.state.utxos.length === 1}>
                    <FontAwesomeIcon icon="sitemap" rotation={90} /> <span className="d-none d-md-inline">Merge With&hellip;</span>
                  </DropdownToggle>
                  <DropdownMenu className="wideMenu">
                    {this.state.mergeUTXOs.map(function (u) {
                      return <DropdownItem onClick={() => this.merge([utxo, u])}>
                        <Row className="align-items-center">
                          <Col><Badge color="primary" className="mr-1" title="Block number"><span className="d-none d-sm-inline">B </span>{u.blockNumber}</Badge><Badge color="secondary" className="mr-1" title="Transaction number"><span className="d-none d-sm-inline">T </span>{u.transactionNumber}</Badge><Badge color="info" className="mr-3" title="Output number"><span className="d-none d-sm-inline">O </span>{u.outputNumber}</Badge></Col>
                          <Col className="text-right">{this.formatPrice(u.value)}</Col>
                        </Row>
                      </DropdownItem>
                    }, this)}
                  </DropdownMenu>
                </ButtonDropdown>
                <Button color="primary" onClick={() => this.openWithdrawModal(utxo)} title="Withdraw"><FontAwesomeIcon icon="sign-out-alt" /> <span className="d-none d-md-inline">Withdraw</span></Button>
              </Col>
            </Row>
          </Container>
        }, this)}
        <Modal isOpen={this.state.transferModalOpen} toggle={this.toggleTransferModal}>
          <Form onSubmit={this.onTransferSubmit}>
            <ModalHeader toggle={this.toggleTransferModal}>Transfer</ModalHeader>
            <ModalBody>
              <FormGroup row>
                <Label for="addressTo" sm={2}>Address</Label>
                <Col sm={10}>
                  <Input type="text" name="addressTo" id="addressTo" placeholder="0x0000000000000000000000000000000000000000" value={this.state.transferAddressTo} onChange={this.handleAddressChange} />
                </Col>
              </FormGroup>
              <FormGroup row>
                <Label for="amount" sm={2}>Amount</Label>
                <Col sm={10}>
                  <Input type="text" name="amount" id="amount" placeholder="0.0" value={this.state.transferAmount} onChange={this.handleAmountChange} />
                </Col>
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <Button color="success" type="submit" className="mr-2"><FontAwesomeIcon icon="arrow-right" /> <span className="d-none d-sm-inline">Transfer</span></Button>
              <Button color="secondary" onClick={this.toggleTransferModal}>Cancel</Button>
            </ModalFooter>
          </Form>
        </Modal>
        <Modal isOpen={this.state.withdrawModalOpen} toggle={this.toggleWithdrawModal}>
          <Form onSubmit={this.onWithdrawSubmit}>
            <ModalHeader toggle={this.toggleWithdrawModal}>Start Withdraw</ModalHeader>
            <ModalBody>
              <p className="lead">You are about to initiate withdrawal process. It will take 2 weeks period.</p>
            </ModalBody>
            <ModalFooter>
              <Button color="success" type="submit" className="mr-2"><FontAwesomeIcon icon="arrow-right" /> <span className="d-none d-sm-inline">Start Withdraw</span></Button>
              <Button color="secondary" onClick={this.toggleWithdrawModal}>Cancel</Button>
            </ModalFooter>
          </Form>
        </Modal>
      </div>
    );
  }
}

export default Transactions;
