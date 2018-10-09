import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Container, Row, Col, Button, ButtonGroup, ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { BN } from 'bn.js';
import './History.css';

class History extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filter: 'withdrawals', //'deposits',
      sortDropdownOpen: false,
      deposits: [],
      withdrawals: [],
      priorities: {},
    };

    this.setFilter = this.setFilter.bind(this);
    this.toggleSort = this.toggleSort.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.account !== prevProps.account) {
      this.loadData(this.props.account);
    }

    if (this.props.priorityQueueContract !== prevProps.priorityQueueContract) {
      this.loadPriorityQueue();
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

  formatDepositStatus(status) {
    switch (parseInt(status)) {
      case 0:
        return 'No deposit';
      case 1:
        return 'Deposited';
      case 2:
        return 'Withdraw Started';
      case 3:
        return 'Withdraw Completed';
      case 4:
        return 'Deposit Confirmed';
      default:
        return '';
    }
  }

  formatTime(timestamp) {
    if (!timestamp)
      return '';

    var date = new Date(timestamp * 1000);

    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    var min = date.getMinutes();
    var sec = date.getSeconds();

    month = (month < 10 ? "0" : "") + month;
    day = (day < 10 ? "0" : "") + day;
    hour = (hour < 10 ? "0" : "") + hour;
    min = (min < 10 ? "0" : "") + min;
    sec = (sec < 10 ? "0" : "") + sec;

    var str = date.getFullYear() + "-" + month + "-" + day + " " +  hour + ":" + min + ":" + sec;

    return str;
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
        let record = await this.props.plasmaContract.methods.allDepositRecordsForUser(this.props.account, index).call();
        records.push(record);
      }
    } catch (err) {
      let deposits = await Promise.all(records.map(async (record) => {
        let recordIndex = parseInt(record);
        return await this.props.plasmaContract.methods.depositRecords(recordIndex).call();
      }));

      this.setState({ deposits: deposits });
    }
  }

  async loadWithdrawals(address) {
    let records = [];
    let recordToWithdrawalMap = {};

    try {
      for (let index = 0; ; index++) {
        let record = await this.props.plasmaContract.methods.allExitsForUser(this.props.account, index).call();
        records.push(record);
      }
    } catch (err) {
      let withdrawals = await Promise.all(records.map(async (record) => {
        let withdrawal = await this.props.plasmaContract.methods.exitRecords(record).call();
        withdrawal.partialHash = record;
        return withdrawal;
      }));

      this.setState({ withdrawals: withdrawals, recordToWithdrawalMap: recordToWithdrawalMap });
    }
  }

  async loadPriorityQueue() {
    if (!this.props.priorityQueueContract)
      return;

    let priorities = {};

    try {
      for (let index = 0; ; index++) {
        let queueItem = await this.props.priorityQueueContract.methods.heapList(index).call();
        priorities[queueItem.partialHash] = queueItem.priority;
      }
    } catch (err) {
      // Estimation for exit
      const record = await this.props.priorityQueueContract.methods.getMin().call();
      const withdrawal = await this.props.plasmaContract.methods.exitRecords(record).call();
      const exitDelay = await this.props.plasmaContract.methods.ExitDelay().call();
      const estimation = parseInt(withdrawal.timePublished) + parseInt(exitDelay);

      this.setState({ priorities: priorities, estimation: estimation, minPriority: priorities[record] });
    }
  }

  loadData(address) {
    this.loadDeposits(address);
    this.loadWithdrawals(address);
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
        <div hidden={this.state.filter !== 'deposits'}>
          {this.state.deposits.map(function (deposit) {
            return <Container className="tx p-3">
              <Row className="align-items-center">
                <Col className="col-4 lead"><span className="font-weight-bold">{this.formatPrice(deposit.amount)}</span></Col>
                <Col className="col-6 lead"><span className="font-weight-bold">{this.formatDepositStatus(deposit.status)}</span></Col>
                <Col className="col-2 text-right">
                  <a className="btn btn-info" href={"https://rinkeby.etherscan.io/address/" + deposit.from} target="_blank"><FontAwesomeIcon icon="external-link-alt" /></a>
                </Col>
              </Row>
            </Container>
          }, this)}
        </div>
        <div hidden={this.state.filter !== 'withdrawals'}>
          {this.state.withdrawals.map(function (withdrawal) {
            return <Container className="tx p-3">
              <Row className="align-items-center">
                <Col className="col-4 lead">{this.formatTime(withdrawal.timePublished)}</Col>
                <Col className="col-2 lead"><span className="font-weight-bold">{this.formatPrice(withdrawal.amount)}</span></Col>
                <Col className="col-4 lead">Priority: <span className="font-weight-bold">{this.state.priorities[withdrawal.partialHash]}</span></Col>
                <Col className="col-2 lead text-right"><span className={"font-weight-bold " + (withdrawal.isValid ? "text-success" : "text-danger")}>{withdrawal.isValid ? "Valid" : "Invalid"}</span></Col>
              </Row>
            </Container>
          }, this)}
          <p className="lead mx-3 mt-4 text-muted">First item in the queue has the priority {this.state.minPriority} and will exit by {this.formatTime(this.state.estimation)}</p>
        </div>
      </div>
    );
  }
}

export default History;