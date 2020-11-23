import React from "react";

export default class TrafficList extends React.Component {
  state = {
    isLoaded: false,
    error: null,
    items: [],
  };

  componentDidMount() {
    fetch("http://localhost:7777/traffic")
      .then((data) => data.json())
      .then(
        (items) => {
          this.setState({
            isLoaded: true,
            error: null,
            items,
          });
        },
        (error) => {
          this.setState({
            isLoaded: true,
            error,
            items: [],
          });
        }
      );
  }

  render() {
    return;
  }
}
