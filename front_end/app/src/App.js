import os from "os";
import logo from './logo.svg';
import './App.css';
require("dotenv").config({ path: `${os.homedir()}/.campion/.env` });

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Account id:
          { process.env.REACT_APP_APIKEY }
        </p>
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

export default App;
