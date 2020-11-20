import React from "react";
import logo from "./logo.svg";
import moment from "moment";
import "./App.css";

class App extends React.Component {
  state = {
    events: [],
    traffic: [],
  };

  componentWillMount() {
    fetch("http://localhost:7777/events").then((data) => {
      data.json().then((events, error) => {
        this.setState({ events });
      });
    });

    fetch("http://localhost:7777/traffic").then((data) => {
      data.json().then((traffic, error) => {
        this.setState({ traffic });
      });
    });
  }

  render() {
    const events = this.state.events.slice(0, 10).map((event) => {
      if (event.EVENT === "STATE_CHANGE") {
        return (
          <li key={event.TIME}>
            <strong>
              {event.ID} - {moment(event.TIME).fromNow()}
            </strong>
            : Circuit-breaker status changed from{" "}
            {event.OLD_STATE.toLowerCase()} to {event.NEW_STATE.toLowerCase()}{" "}
            {event.MODE === "AUTO" ? "automatically." : "by user."}
          </li>
        );
      } else {
        return (
          <li key={event.TIME}>
            {" "}
            <strong>
              {event.ID} - {moment(event.TIME).fromNow()}
            </strong>
            : Circuit-breaker settings were changed.
          </li>
        );
      }
    });

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>Number of Events: {this.state.events.length}</p>
          <ul>{events}</ul>
          <p>Number of Traffic: {this.state.traffic.length}</p>
        </header>
      </div>
    );
  }
}

export default App;
