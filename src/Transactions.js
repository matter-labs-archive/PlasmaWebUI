import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Container, Row, Col, Button, ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap';
import { PlasmaTransactionWithSignature } from './plasma-tx-js/Tx/RLPtxWithSignature';
import { PlasmaTransaction, TxTypeSplit } from './plasma-tx-js/Tx/RLPtx';
import { TransactionInput } from './plasma-tx-js/Tx/RLPinput';
import { TransactionOutput } from './plasma-tx-js/Tx/RLPoutput';
import { BN } from 'bn.js';
import * as ethUtil from 'ethereumjs-util';
import './Transactions.css';

class Transactions extends Component {
  constructor(props) {
    super(props);

    this.state = {
      sortDropdownOpen: false,
      transferModalOpen: false,
      transferAddressTo: '',
      transferAmount: '',
      utxos: [],
    };

    this.toggleSort = this.toggleSort.bind(this);
    this.toggleTransferModal = this.toggleTransferModal.bind(this);
    this.handleAddressChange = this.handleAddressChange.bind(this);
    this.handleAmountChange = this.handleAmountChange.bind(this);
    this.onTransferSubmit = this.onTransferSubmit.bind(this);
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

  onTransferSubmit(event) {
    event.preventDefault();

    let self = this;
    let amount = parseFloat(this.state.transferAmount);

    if (amount > 0) {
      let weiAmount = this.props.web3js.utils.toWei((Math.floor(amount * 1000)).toString(), 'finney');

      this.transfer(this.state.transferUTXO, this.props.account, this.state.transferAddressTo, weiAmount).then(() => {
        self.setState({ transferModalOpen: false });
        console.log('Success!');
      }).catch(error => {
        console.log('Error:', error);
      });
    }
  }

  loadTransactions(address) {
    let self = this;
    let url = `${process.env.REACT_APP_API_URL_PREFIX}/listUTXOs`;

    let payload = {
      "for": `${address}`,
      "blockNumber": 1, 
      "transactionNumber": 0, 
      "outputNumber": 0,
      "limit": 50
    };
    
    fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify(payload)
    })
    .then(  
      function (response) {  
        if (response.status !== 200) {  
          console.log('Responce status error:', response.status);  
          return;  
        }

        response.json().then(function (data) {  
          self.setState({ utxos: data.utxos });

          let balance = new BN();

          data.utxos.map(function (utxo) {
            balance.iadd(new BN(utxo.value));
          });

          self.props.onBalanceChanged(balance.toString());
        });
      }  
    )  
    .catch(function (err) {  
      console.log('Request error:', err);
    });
  }

  transfer(utxo, addressFrom, addressTo, weiAmount) {
    let self = this;

    return new Promise(function (resolve, reject) {
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
        reject('Insufficient funds');
      }

      if (!ethUtil.isValidAddress(addressTo)) {
        reject('Invalid address');
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

      self.props.web3js.eth.personal.sign(txHex, addressFrom).then((sigRes) => {
        console.log(sigRes);

        tx.serializeSignature(sigRes);
        const fullTX = ethUtil.bufferToHex(tx.serialize());

        let url = `${process.env.REACT_APP_API_URL_PREFIX}/sendRawTX`;
        
        let payload = {
          tx: fullTX,
        }

        fetch(url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          mode: 'cors',
          body: JSON.stringify(payload)
        })
        .then(  
          function (response) {  
            if (response.status !== 200) {  
              reject('Responce status error');  
            }

            response.json().then(function (data) {
              if (data.error) {
                reject(data.reason);
              } else {
                resolve();
              }
            });
          }  
        )  
        .catch(function (err) {  
          reject(err);
        });
      }).catch(err => {
        reject(err);
      });
    });
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
                <DropdownItem>Date Added</DropdownItem>
              </DropdownMenu>
            </ButtonDropdown>
          </Col>
        </Row>
        {this.state.utxos.map(function (utxo) {
          return <Container className="tx p-3 shadow">
            <Row className="align-items-center">
              <Col className="text-nowrap"><Badge color="primary" className="mr-1" title="Block number"><span className="d-none d-sm-inline">B </span>{utxo.blockNumber}</Badge><Badge color="secondary" className="mr-1" title="Transaction number"><span className="d-none d-sm-inline">T </span>{utxo.transactionNumber}</Badge><Badge color="info" className="mr-3" title="Output number"><span className="d-none d-sm-inline">O </span>{utxo.outputNumber}</Badge></Col>
              <Col className="lead"><span className="font-weight-bold">{this.formatPrice(utxo.value)}</span></Col>
              <Col className="col-auto">
                <Button color="success" className="mr-0" onClick={() => this.openTransferModal(utxo)} title="Transfer"><FontAwesomeIcon icon="arrow-right" /> <span className="d-none d-sm-inline">Transfer</span></Button>
                <Button hidden={true} color="info" className="mr-2" title="Merge"><FontAwesomeIcon icon="sitemap" rotation={90} /> <span className="d-none d-md-inline">Merge</span></Button>
                <Button hidden={true} color="primary" title="Withdraw"><FontAwesomeIcon icon="sign-out-alt" /> <span className="d-none d-md-inline">Withdraw</span></Button>
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
      </div>
    );
  }
}

export default Transactions;
