export default function Endpoint({ items }) {
  const backgroundColors = [
    "bg-pink-600",
    "bg-purple-600",
    "bg-yellow-600",
    "bg-green-600",
    "bg-blue-600",
    "bg-red-600",
    "bg-indigo-600",
  ];

  const endpoints = items.map((endpoint, idx) => {
    const i = idx % items.length;
    const initials = endpoint.NAME.split(" ")
      .slice(0, 2)
      .map((i) => i[0])
      .join("")
      .toUpperCase();

    return (
      <li className="col-span-1 flex shadow-sm rounded-md">
        <div
          className={
            "flex-shrink-0 flex items-center justify-center w-16 text-white text-sm font-medium rounded-l-md " +
            backgroundColors[i]
          }
        >
          {initials}
        </div>
        <div className="flex-1 flex items-center justify-between border-t border-r border-b border-gray-200 bg-white rounded-r-md truncate">
          <div className="flex-1 px-4 py-2 text-sm truncate">
            <a
              href="#"
              className="text-gray-900 font-medium hover:text-gray-600"
            >
              {endpoint.NAME}
            </a>
            {endpoint.CIRCUIT_STATE === "CLOSED" ? (
              <p className="text-green-500">{endpoint.CIRCUIT_STATE}</p>
            ) : (
              <p className="text-red-500">{endpoint.CIRCUIT_STATE}</p>
            )}
          </div>
          <div className="flex-shrink-0 pr-2">
            <button className="w-8 h-8 bg-white inline-flex items-center justify-center text-gray-400 rounded-full bg-transparent hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <span className="sr-only">Open options</span>
              <svg
                className="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </div>
      </li>
    );
  });

  return (
    <ul className="mt-3 grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {endpoints}
    </ul>
  );
}
