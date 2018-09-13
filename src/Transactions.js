import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Container, Row, Col, Button, ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
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
    let url = `${process.env.REACT_APP_API_URL_PREFIX}/utxos/${address}`;
    let self = this;
    
    fetch(url)
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
            <h2>Transactions</h2>
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
          return <Container className="tx p-3">
            <Row className="align-items-center">
              <Col><span className="lead">{utxo.value}</span></Col>
              <Col className="col-md-auto">
                <Button color="success" className="mr-1"><FontAwesomeIcon icon="arrow-right" /> Transfer</Button>
                <Button color="info" className="mr-1"><FontAwesomeIcon icon="sitemap" rotation={90} /> Megre</Button>
                <Button color="primary"><FontAwesomeIcon icon="sign-out-alt" /> Withdraw</Button>
              </Col>
            </Row>
          </Container>
        }, this)}
      </div>
    );
  }
}

export default Transactions;
