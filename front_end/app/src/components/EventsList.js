import React from "react";
import Events from "./Events";

export default class EventsList extends React.Component {
  state = {
    isLoaded: false,
    error: null,
    items: [],
  };

  componentDidMount() {
    fetch("http://localhost:7777/events")
      .then((data) => data.json())
      .then(
        (items) => {
          this.setState({
            isLoaded: true,
            error: null,
            items: items.sort((a, b) => b.TIME - a.TIME),
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
      <div className="flex flex-col">
        <div className="-my-2 sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Time
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Event
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Description
                    </th>
                  </tr>
                </thead>
                <Events items={this.state.items.slice(0, 10)} />
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
