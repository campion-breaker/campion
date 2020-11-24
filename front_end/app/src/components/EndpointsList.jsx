import React from "react";
import Endpoints from "./Endpoints";

export default class EndpointsList extends React.Component {
  state = {
    isLoaded: false,
    error: null,
    items: [],
  };

  componentDidMount() {
    fetch("http://localhost:7777/endpoints")
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
    return (
      <div>
        <h2 className="text-gray-500 text-xs font-medium uppercase tracking-wide">
          Services Protected by Campion
        </h2>

        <Endpoints items={this.state.items} />
      </div>
    );
  }
}
