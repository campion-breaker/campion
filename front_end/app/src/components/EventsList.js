import React from "react";
import moment from "moment";

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
  }

  render() {
    const events = this.state.items.slice(0, 10).map((event) => {
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
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        { moment(Date.now()).fromNow() }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ak
                      </div>
                      <div className="text-sm text-gray-500">https://arthurk.dev/</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">Circuit-Breaker Status</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      User flipped circuit-breaker from half-open to open. This was a manual state change.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
