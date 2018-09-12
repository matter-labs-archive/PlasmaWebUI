import React, { Component } from 'react';
import { Alert, Button, ButtonGroup, ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      metamaskInfoOpen: true,
      sortDropdownOpen: false,
    };

    this.toggleSort = this.toggleSort.bind(this);
    this.onDismissMetamaskInfo = this.onDismissMetamaskInfo.bind(this);
  }

  onDismissMetamaskInfo() {
    let state = this.state;
    state.metamaskInfoOpen = false;
    this.setState(state);
  }

  toggleSort() {
    let state = this.state;
    state.sortDropdownOpen = !state.sortDropdownOpen;
    this.setState(state);
  }

  render() {
    return (
      <div className="App">
        <div className="d-flex flex-column flex-md-row align-items-center p-3 px-md-4 mb-3 bg-dark border-bottom shadow-sm">
          <h5 className="my-0 mr-md-auto font-weight-normal"><a href="/"><img src={logo} className="logo" alt="logo" /></a></h5>
          <nav className="my-2 my-md-0 mr-md-3">
            <Button color="primary">Add ETH</Button>
          </nav>
        </div>
        <div className="container">
          <Alert color="info" isOpen={this.state.metamaskInfoOpen} toggle={this.onDismissMetamaskInfo}>
            Please enable MetaMask extension
          </Alert>
          <div className="row">
            <div className="col">
              <h2>Transactions</h2>
            </div>
            <div className="col text-right">
              <ButtonDropdown isOpen={this.state.sortDropdownOpen} toggle={this.toggleSort}>
                <DropdownToggle caret>
                  Sort By
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem>Date Added</DropdownItem>
                </DropdownMenu>
              </ButtonDropdown>
            </div>
          </div>
          <Alert color="secondary">
            No Transactions
          </Alert>
          <hr />
          <div className="row">
            <div className="col">
              <h2>History</h2>
            </div>
            <div className="col text-center">
              <ButtonGroup>
                <Button color="secondary">Deposits</Button>
                <Button color="secondary" outline="true">Pending withdrawals</Button>
              </ButtonGroup>
            </div>
            <div className="col text-right">
              <ButtonDropdown isOpen={this.state.sortDropdownOpen} toggle={this.toggleSort}>
                <DropdownToggle caret>
                  Sort By
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem>Date Added</DropdownItem>
                </DropdownMenu>
              </ButtonDropdown>
            </div>
          </div>
          <Alert color="secondary">
            No History Records
          </Alert>
          <footer class="pt-4 my-md-5 pt-md-5 border-top">
            <div class="row">
              <div class="col-12 col-md">
                <img class="mb-2 bg-dark logo-icon" src={logo} alt="" />
                <small class="d-block mb-3 text-muted">&copy;&nbsp;2018</small>
              </div>
              <div class="col-6 col-md">
                <h5>Features</h5>
                <ul class="list-unstyled text-small">
                  <li><a class="text-muted" href="https://thematter.io" target="_blank">Matter Plasma</a></li>
                </ul>
              </div>
              <div class="col-6 col-md">
                <h5>Resources</h5>
                <ul class="list-unstyled text-small">
                  <li><a class="text-muted" href="https://github.com/matterinc/" target="_blank">GitHub</a></li>
                </ul>
              </div>
              <div class="col-6 col-md">
                <h5>About</h5>
                <ul class="list-unstyled text-small">
                  <li><a class="text-muted" href="https://thematter.io/#rec66652294" target="_blank">Team</a></li>
                </ul>
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  }
}

export default App;
