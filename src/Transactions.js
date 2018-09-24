import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Container, Row, Col, Button, ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem, Badge } from 'reactstrap';
import './Transactions.css';

class Transactions extends Component {
  constructor(props) {
    super(props);

    this.state = {
      sortDropdownOpen: false,
      utxos: [],
    };

    this.toggleSort = this.toggleSort.bind(this);

    this.loadTransactions(process.env.REACT_APP_ETH_ADDRESS);
  }

  toggleSort() {
    let state = this.state;
    state.sortDropdownOpen = !state.sortDropdownOpen;
    this.setState(state);
  }

  setUtxos(utxos) {
    let state = this.state;
    state.utxos = utxos;
    this.setState(state)
  }

  loadTransactions(address) {
    let url = `${process.env.REACT_APP_API_URL_PREFIX}/listUTXOs`;
    let self = this;

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
          self.setUtxos(data.utxos);
        });
      }  
    )  
    .catch(function (err) {  
      console.log('Request error:', err);
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
              <Col className="lead"><span className="font-weight-bold">{utxo.value}</span>&nbsp;Wei</Col>
              <Col className="col-auto">
                <Button color="success" className="mr-2"><FontAwesomeIcon icon="arrow-right" /> <span className="d-none d-sm-inline">Transfer</span></Button>
                <Button color="info" className="mr-2"><FontAwesomeIcon icon="sitemap" rotation={90} /> <span className="d-none d-md-inline">Megre</span></Button>
                <Button color="primary"><FontAwesomeIcon icon="sign-out-alt" /> <span class="d-none d-md-inline">Withdraw</span></Button>
              </Col>
            </Row>
          </Container>
        }, this)}
      </div>
    );
  }
}

export default Transactions;
