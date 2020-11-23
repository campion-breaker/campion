import moment from "moment";

export default function Events({ items }) {
  const tableRow = items.map((event) => {
    return (
      <tr key={event.TIME}>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">
            {moment(event.TIME).fromNow()}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{event.NAME}</div>
          <div className="text-sm text-gray-500">{event.ID}</div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-500">
            {event.EVENT === "STATE_CHANGE"
              ? "Circuit-Breaker Status Change"
              : "Configuration Change"}
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">
          {event.EVENT === "STATE_CHANGE"
            ? `Circuit-breaker flipped from ${event.OLD_STATE} to ${
                event.NEW_STATE
              }. This was ${
                event.MODE === "AUTO" ? "an automatic" : "a manual"
              } change.`
            : `Circuit-breaker configuration settings were ${
                event.METHOD === "ADD" ? "added" : "changed"
              }.`}
        </td>
      </tr>
    );
  });

  return (
    <tbody className="bg-white divide-y divide-gray-200">{tableRow}</tbody>
  );
}
