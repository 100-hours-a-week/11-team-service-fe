const DateSeparator = ({ date }) => {
  const formatted = new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="flex items-center justify-center py-4">
      <span className="bg-gray-100 text-gray-500 text-xs font-medium px-3 py-1 rounded-full">
        {formatted}
      </span>
    </div>
  );
};

export default DateSeparator;
