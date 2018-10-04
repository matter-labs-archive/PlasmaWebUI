import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Container, Row, Col, Button, ButtonGroup, ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { BN } from 'bn.js';
import './History.css';

class History extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filter: 'deposits',
      sortDropdownOpen: false,
      deposits: [],
      withdrawals: [],
    };

    this.setFilter = this.setFilter.bind(this);
    this.toggleSort = this.toggleSort.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.account !== prevProps.account) {
      if (this.state.filter === 'deposits') {
        this.loadDeposits(this.props.account);
      }
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

  setFilter(filter) {
    if (this.state.filter !== filter) {
      this.setState({ filter: filter });
    }
  }

  toggleSort() {
    this.setState({ sortDropdownOpen: !this.state.sortDropdownOpen });
  }

  async loadDeposits(address) {
    let records = [];

    try {
      for (let index = 0; ; index++) {
        let record = await this.props.contract.methods.allDepositRecordsForUser(this.props.account, index).call();
        records.push(record);
      }
    } catch (err) {
      let deposits = await Promise.all(records.map(async (record) => {
        let recordIndex = parseInt(record);
        return await this.props.contract.methods.depositRecords(recordIndex).call();
      }));

      this.setState({ deposits: deposits });
    }
  }

  render() {
    return (
      <div className="History">
        <Row className="px-3">
          <Col>
            <h2>History</h2>
          </Col>
          <Col className="text-center mt-1 mb-3 mt-md-0 mb-md-0">
            <ButtonGroup>
              <Button color="secondary" onClick={() => this.setFilter('deposits')} outline={this.state.filter !== 'deposits'}><FontAwesomeIcon icon="sign-in-alt" /> Deposits</Button>
              <Button color="secondary" onClick={() => this.setFilter('withdrawals')} outline={this.state.filter !== 'withdrawals'}><FontAwesomeIcon icon="sign-out-alt" /> <span className="d-none d-sm-inline">Pending </span>Withdrawals</Button>
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

        {this.state.deposits.map(function (deposit) {
          return <Container className="tx p-3">
            <Row className="align-items-center">
              <Col className="lead text-nowrap">{deposit.from} <FontAwesomeIcon icon="arrow-right" /></Col>
              <Col className="lead"><span className="font-weight-bold">{this.formatPrice(deposit.amount)}</span></Col>
              <Col className="col-auto">
                <a className="btn btn-info" href={"https://rinkeby.etherscan.io/address/" + deposit.from} target="_blank"><FontAwesomeIcon icon="external-link-alt" /></a>
              </Col>
            </Row>
          </Container>
        }, this)}
      </div>
    );
  }
}

export default History;