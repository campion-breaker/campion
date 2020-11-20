import React from 'react';
import os from 'os';
import logo from './logo.svg';
import './App.css';
require('dotenv').config({ path: `${os.homedir()}/.campion/.env` });

class App extends React.Component {
  state = {
    events: [],
    traffic: [],
  };

  componentDidMount() {
    fetch('http://localhost:7777/events').then((data) => {
      data.json().then((events, error) => {
        this.setState({ events });
      });
    });

    fetch('http://localhost:7777/traffic').then((data) => {
      data.json().then((traffic, error) => {
        console.log(traffic);
        this.setState({ traffic });
      });
    });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p></p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;
