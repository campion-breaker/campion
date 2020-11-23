import React from "react";
import moment from "moment";

class App extends React.Component {
  state = {
    events: {
      isLoaded: false,
      error: null,
      items: [],
    },
    traffic: {
      isLoaded: false,
      error: null,
      items: [],
    },
  };

  componentDidMount() {
    fetch("http://localhost:7777/events")
      .then((data) => data.json())
      .then(
        (items) => {
          this.setState({
            events: {
              isLoaded: true,
              error: null,
              items: items.sort((a, b) => b.TIME - a.TIME),
            },
          });
        },
        (error) => {
          this.setState({
            traffic: {
              isLoaded: true,
              error,
              items: [],
            },
          });
        }
      );

    fetch("http://localhost:7777/traffic")
      .then((data) => data.json())
      .then(
        (items) => {
          this.setState({
            traffic: {
              isLoaded: true,
              error: null,
              items,
            },
          });
        },
        (error) => {
          this.setState({
            traffic: {
              isLoaded: true,
              error,
              items: [],
            },
          });
        }
      );
  }

  render() {
    const events = this.state.events.items.slice(0, 10).map((event) => {
      if (event.EVENT === "STATE_CHANGE") {
        return (
          <li key={event.TIME}>
            <strong>
              {event.NAME} - {moment(event.TIME).fromNow()}
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
              {event.NAME} - {moment(event.TIME).fromNow()}
            </strong>
            : Circuit-breaker settings were changed.
          </li>
        );
      }
    });

    return (
      <div className="App">
        <header className="App-header">
          <p>Number of Events: {this.state.events.items.length}</p>
          <ul>{events}</ul>
          <p>Number of Traffic: {this.state.traffic.items.length}</p>
        </header>
      </div>
    );
  }
}

export default App;
