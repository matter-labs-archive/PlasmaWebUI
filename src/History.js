import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Container, Row, Col, Button, ButtonGroup, ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import './History.css';

class History extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filter: 'deposits',
      sortDropdownOpen: false,
      utxos: [],
    };

    this.setFilter = this.setFilter.bind(this);
    this.toggleSort = this.toggleSort.bind(this);

    this.loadHistory(process.env.REACT_APP_ETH_ADDRESS);
  }

  setFilter(filter) {
    if (this.state.filter !== filter) {
      let state = this.state;
      state.filter = filter;
      this.setState(state);
    }
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

  loadHistory(address) {
  }

  render() {
    return (
      <div className="History">
        <Row className="px-3">
          <Col>
            <h2>History</h2>
          </Col>
          <Col className="text-center mt-1 mb-3 mt-sm-0 mb-sm-0">
            <ButtonGroup>
              <Button color="secondary" onClick={() => this.setFilter('deposits')} outline={this.state.filter !== 'deposits'}><FontAwesomeIcon icon="sign-in-alt" /> Deposits</Button>
              <Button color="secondary" onClick={() => this.setFilter('withdrawals')} outline={this.state.filter !== 'withdrawals'}><FontAwesomeIcon icon="sign-out-alt" /> Pending Withdrawals</Button>
            </ButtonGroup>
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
              <Col className="col-auto">
                <Button color="info"><FontAwesomeIcon icon="external-link-alt" /></Button>
              </Col>
            </Row>
          </Container>
        }, this)}
      </div>
    );
  }
}

export default History;